import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { GFlowLink, GFlowNode, JsonValue } from '../../core/gflow.types';
import { flattenInputKeys } from '../utils/input-map.utils';

export interface EditEntry {
  key: string;
  value: JsonValue;
}

export interface EditConfig {
  fields: EditEntry[];
}

export const createEditEntry = (): EditEntry => ({
  key: '',
  value: '',
});

export const createEditConfig = (): EditConfig => ({
  fields: [createEditEntry()],
});

const isEditConfig = (value: unknown): value is Partial<EditConfig> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeValue = (value: JsonValue | undefined): JsonValue => {
  if (value === undefined) return '';
  try { return JSON.parse(JSON.stringify(value)); } catch { return ''; }
};

const normalizeFields = (value: unknown, fallback: EditEntry[]): EditEntry[] => {
  const result: EditEntry[] = [];
  if (isEditConfig(value) && Array.isArray(value.fields)) {
    for (const field of value.fields) {
      if (field && typeof field === 'object') {
        const key = typeof (field as any).key === 'string' ? (field as any).key.trim() : '';
        result.push({
          key,
          value: normalizeValue((field as any).value as JsonValue | undefined),
        });
      }
    }
  }
  return result.length ? result : fallback.map((item) => ({ ...item }));
};

const setDeep = (obj: any, path: string, value: any) => {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
};

const buildOutputMap = (fields: EditEntry[]): Record<string, JsonValue> => {
  const map: Record<string, JsonValue> = {};
  for (const field of fields) {
    if (!field.key) continue;
    setDeep(map, field.key, normalizeValue(field.value as JsonValue));
  }
  return map;
};

const ensureOutputPort = (node: GFlowNode) => {
  if (!Array.isArray(node.outputs)) node.outputs = [];
  if (!node.outputs.length) node.outputs.push({});
};

export const ensureEditConfig = (node: GFlowNode): EditConfig => {
  const defaults = createEditConfig();
  const normalized: EditConfig = {
    fields: normalizeFields(node.config, defaults.fields),
  };
  ensureOutputPort(node);
  const map = buildOutputMap(normalized.fields);
  node.outputs![0] = { ...node.outputs![0], map };
  node.config = normalized;
  node.configured = normalized.fields.some((entry) => Boolean(entry.key));
  return normalized;
};

export const applyEditConfig = (node: GFlowNode, fields: EditEntry[]): EditConfig => {
  const snapshot: EditConfig = {
    fields: fields.map((entry) => ({ key: entry.key.trim(), value: normalizeValue(entry.value as JsonValue) })),
  };
  ensureOutputPort(node);
  node.config = snapshot;
  node.outputs![0] = { ...node.outputs![0], map: buildOutputMap(snapshot.fields) };
  node.configured = snapshot.fields.some((entry) => Boolean(entry.key));
  return {
    fields: snapshot.fields.map((entry) => ({ key: entry.key, value: normalizeValue(entry.value as JsonValue) })),
  };
};

@Component({
  selector: 'app-config-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, SelectModule],
  template: `
    <div class="config-panel">
      
      <div class="block-header">
        <span class="block-label">Variables à modifier</span>
      </div>

      <div class="block-card">
        <div class="fields-container">
          <div class="field-row" *ngFor="let field of fields; let i = index; trackBy: trackByFn">
            
            <div class="col-key">
              <p-select 
                [options]="keys" 
                [(ngModel)]="field.key" 
                [editable]="true" 
                placeholder="Clé cible" 
                size="small" 
                appendTo="body"
                (onChange)="emit()" 
                [style]="{'width': '100%'}">
              </p-select>
            </div>
            
            <div class="col-val">
              <input
                pInputText
                class="input-flat"
                [(ngModel)]="field.value"
                placeholder="Valeur"
                (change)="emit()"
                pSize="small"
              />
            </div>

            <div class="col-action">
              <p-button
                size="small"
                severity="danger"
                icon="pi pi-times"
                text
                (click)="remove(i)"
              />
            </div>

          </div>
        </div>

        <div class="add-row">
          <p-button size="small" severity="secondary" icon="pi pi-plus" label="Ajouter une variable" text (click)="add()" />
        </div>
      </div>

    </div>
  `,
  styles: [`
    .config-panel { display: flex; flex-direction: column; gap: 0.5rem; }
    
    .block-header { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .block-label { font-weight: 700; font-size: 0.9rem; color: var(--p-text-color); }

    .block-card {
      background-color: var(--background-color-100);
      border-radius: var(--radius-m);
      padding: 0.75rem;
      border: 1px solid var(--background-color-200);
    }

    .fields-container { display: flex; flex-direction: column; gap: 0.5rem; }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr 32px;
      gap: 0.5rem;
      align-items: center;
    }

    .input-flat { width: 100%; }

    .add-row { margin-top: 0.75rem; display: flex; justify-content: center; }
  `],
})
export class ConfigEdit implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Input() inputMap: JsonValue | null = null;

  @Output() configChange = new EventEmitter<unknown>();

  fields: EditEntry[] = [];
  keys: string[] = [];

  ngOnInit() { this.syncFromNode(); this.refreshKeys(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node']) this.syncFromNode();
    if (changes['inputMap']) this.refreshKeys();
  }

  trackByFn(index: number, item: EditEntry): any { return index; }

  private refreshKeys() { this.keys = flattenInputKeys(this.inputMap); }

  add() {
    this.fields.push(createEditEntry());
    this.emit();
  }

  remove(index: number) {
    this.fields.splice(index, 1);
    if (!this.fields.length) this.fields.push(createEditEntry());
    this.emit();
  }

  private syncFromNode() {
    if (!this.node) return;
    const cfg = ensureEditConfig(this.node);
    this.fields = cfg.fields.map((entry) => ({ key: entry.key, value: normalizeValue(entry.value as JsonValue) }));
    this.configChange.emit({ fields: this.fields.map((entry) => ({ ...entry })) });
  }

  emit() {
    if (!this.node) return;
    const snapshot = applyEditConfig(this.node, this.fields);
    this.fields = snapshot.fields.map((entry) => ({ key: entry.key, value: normalizeValue(entry.value as JsonValue) }));
    this.configChange.emit({ fields: this.fields.map((entry) => ({ ...entry })) });
  }
}
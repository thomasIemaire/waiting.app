import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { GFlowLink, GFlowNode, JsonValue } from '../../core/gflow.types';

export interface EditEntry {
  key: string;
  value: JsonValue;
}

export interface EditConfig {
  fields: EditEntry[];
}

interface LegacyEntry {
  field?: string;
  value?: JsonValue;
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

const isLegacyArray = (value: unknown): value is LegacyEntry[] =>
  Array.isArray(value);

const normalizeValue = (value: JsonValue | undefined): JsonValue => {
  if (value === undefined) {
    return '';
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return '';
  }
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
  } else if (isLegacyArray(value)) {
    for (const entry of value) {
      const key = typeof entry.field === 'string' ? entry.field.trim() : '';
      result.push({ key, value: normalizeValue(entry.value) });
    }
  }

  if (!result.length) {
    return fallback.map((item) => ({ ...item }));
  }

  return result;
};

const buildOutputMap = (fields: EditEntry[]): Record<string, JsonValue> => {
  const map: Record<string, JsonValue> = {};
  for (const field of fields) {
    if (!field.key) {
      continue;
    }
    map[field.key] = normalizeValue(field.value as JsonValue);
  }
  return map;
};

const ensureOutputPort = (node: GFlowNode) => {
  if (!Array.isArray(node.outputs)) {
    node.outputs = [];
  }
  if (!node.outputs.length) {
    node.outputs.push({});
  }
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
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  template: `
    <div class="config__wrapper">
      <div class="row" *ngFor="let field of fields; let i = index">
        <div class="row__inputs">
          <input
            pInputText
            pSize="small"
            [(ngModel)]="field.key"
            placeholder="Clé"
            (ngModelChange)="emit()"
          />
          <input
            pInputText
            pSize="small"
            [(ngModel)]="field.value"
            placeholder="Valeur"
            (ngModelChange)="emit()"
          />
        </div>
        <div class="row__actions">
          <p-button
            size="small"
            severity="danger"
            icon="pi pi-trash"
            text
            (click)="remove(i)"
          />
        </div>
      </div>

      <p-button size="small" severity="secondary" icon="pi pi-plus" label="Ajouter" (click)="add()" />
    </div>
  `,
  styles: [`
    .config__wrapper { display: grid; gap: .75rem; }
    .row { display: grid; grid-template-columns: 1fr auto; gap: .5rem; align-items: center; }
    .row__inputs { display: grid; gap: .5rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  `],
})
export class ConfigEdit implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Input() inputMap: JsonValue | null = null;

  @Output() configChange = new EventEmitter<unknown>();

  fields: EditEntry[] = [];

  ngOnInit() {
    this.syncFromNode();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node']) {
      this.syncFromNode();
    }
  }

  add() {
    this.fields.push(createEditEntry());
    this.emit();
  }

  remove(index: number) {
    this.fields.splice(index, 1);
    if (!this.fields.length) {
      this.fields.push(createEditEntry());
    }
    this.emit();
  }

  private syncFromNode() {
    if (!this.node) {
      return;
    }
    const cfg = ensureEditConfig(this.node);
    this.fields = cfg.fields.map((entry) => ({ key: entry.key, value: normalizeValue(entry.value as JsonValue) }));
    this.configChange.emit({ fields: this.fields.map((entry) => ({ ...entry })) });
  }

  emit() {
    if (!this.node) {
      return;
    }
    const snapshot = applyEditConfig(this.node, this.fields);
    this.fields = snapshot.fields.map((entry) => ({ key: entry.key, value: normalizeValue(entry.value as JsonValue) }));
    this.configChange.emit({ fields: this.fields.map((entry) => ({ ...entry })) });
  }
}

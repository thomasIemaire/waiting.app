import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { GFlowLink, GFlowNode, JsonValue } from '../../core/gflow.types';
import { flattenInputKeys } from '../utils/input-map.utils';

export interface SwitchCaseConfig {
  id: string;
  name: string;
  value: string;
}

export interface SwitchConfig {
  key: string;
  cases: SwitchCaseConfig[];
}

export type SwitchConfigEvent =
  | { type: 'config-updated'; config: SwitchConfig; previousCaseIds?: string[] }
  | { type: 'cases-changed'; config: SwitchConfig; previousCaseIds?: string[] };

const createCaseId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createSwitchConfig = (): SwitchConfig => ({
  key: '',
  cases: [createSwitchCase('Case 1')],
});

export const cloneSwitchConfig = (config: SwitchConfig): SwitchConfig => ({
  key: config.key,
  cases: config.cases.map((item) => ({ ...item })),
});

export const ensureSwitchConfig = (node: GFlowNode): SwitchConfig => {
  const raw = node.config as SwitchConfig | undefined;
  if (!isSwitchConfig(raw)) {
    node.config = createSwitchConfig();
  }

  const normalized = node.config as SwitchConfig;
  normalized.key ??= '';
  normalized.cases = Array.isArray(normalized.cases) && normalized.cases.length
    ? normalized.cases.map((item, index) => ({
      id: item.id || createCaseId(),
      name: item.name || `Case ${index + 1}`,
      value: item.value ?? '',
    }))
    : createSwitchConfig().cases;

  node.outputs = [...normalized.cases.map((item) => ({ name: item.name }))];

  return normalized;
};

const createSwitchCase = (name: string): SwitchCaseConfig => ({
  id: createCaseId(),
  name,
  value: '',
});

const isSwitchConfig = (value: unknown): value is SwitchConfig => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as SwitchConfig;
  return Array.isArray(candidate.cases);
};

@Component({
  selector: 'app-config-switch',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, InputTextModule, ButtonModule],
  template: `
    <div class="config-panel">
      
      <div class="config-line">
        <span class="line-label">Clé à évaluer</span>
        <p-select size="small" [options]="keys" [showClear]="true" [editable]="true" 
                  placeholder="Sélectionner une variable" [(ngModel)]="config.key" 
                  (onChange)="onKeyChange($event.value)" styleClass="w-full" appendTo="body"
                  [style]="{'width': '100%'}">
        </p-select>
      </div>

      <div class="block-header" style="margin-top: 1rem;">
        <span class="block-label">Cas possibles</span>
      </div>

      <div class="block-card">
        <div class="cases-container">
          <div class="case-row" *ngFor="let entry of config.cases; let i = index">
            
            <input pInputText class="input-flat" type="text" placeholder="Nom (Sortie)" pSize="small"
                   [(ngModel)]="entry.name" (ngModelChange)="onCaseNameChange(i, $event)" />
            
            <div class="operator">=</div>

            <input pInputText class="input-flat" type="text" placeholder="Valeur attendue" pSize="small"
                   [(ngModel)]="entry.value" (ngModelChange)="onCaseValueChange(i, $event)" />
            
            <p-button icon="pi pi-times" size="small" severity="danger" text (click)="removeCase(i)"></p-button>
          </div>
        </div>

        <div class="add-row">
          <p-button icon="pi pi-plus" label="Ajouter un cas" severity="secondary" size="small" text (click)="addCase()"></p-button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .config-panel { display: flex; flex-direction: column; gap: 0.5rem; }
    .config-line { display: flex; flex-direction: column; gap: 0.25rem; }
    .line-label { font-weight: 500; font-size: 0.875rem; color: var(--p-text-color); }

    .block-header { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .block-label { font-weight: 700; font-size: 0.9rem; color: var(--p-text-color); }

    .block-card {
      background-color: var(--background-color-100);
      border-radius: var(--radius-m);
      padding: 0.75rem;
      border: 1px solid var(--background-color-200);
    }

    .cases-container { display: flex; flex-direction: column; gap: 0.5rem; }

    .case-row {
      display: grid;
      grid-template-columns: 1fr 20px 1fr 32px;
      gap: 0.5rem;
      align-items: center;
    }

    .input-flat { width: 100%; }
    .operator { text-align: center; font-weight: bold; color: var(--p-text-muted-color); }

    .add-row { margin-top: 0.75rem; display: flex; justify-content: center; }
  `]
})
export class ConfigSwitchComponent implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Input() inputMap: JsonValue | null = null;

  @Output() configChange = new EventEmitter<unknown>();

  keys: string[] = [];
  config: SwitchConfig = createSwitchConfig();

  ngOnInit() { this.syncFromNode(); this.refreshKeys(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node']) this.syncFromNode();
    if (changes['inputMap']) this.refreshKeys();
  }

  addCase() {
    const nextIndex = this.config.cases.length + 1;
    this.config.cases.push(createSwitchCase(`Case ${nextIndex}`));
    this.emit('cases-changed');
  }

  removeCase(index: number) {
    if (this.config.cases.length <= 1) return;
    this.config.cases.splice(index, 1);
    this.emit('cases-changed');
  }

  onKeyChange(key: string) {
    this.config.key = key;
    this.emit('config-updated');
  }

  onCaseNameChange(index: number, name: string) {
    this.config.cases[index].name = name;
    this.emit('cases-changed');
  }

  onCaseValueChange(index: number, value: string) {
    this.config.cases[index].value = value;
    this.emit('config-updated');
  }

  private syncFromNode() {
    if (!this.node) return;
    const normalized = ensureSwitchConfig(this.node);
    this.config = cloneSwitchConfig(normalized);
  }

  private refreshKeys() {
    this.keys = flattenInputKeys(this.inputMap ?? {});
  }

  private emit(type: SwitchConfigEvent['type']) {
    const normalized = ensureSwitchConfig(this.node);
    const previousIds = normalized.cases.map((item) => item.id);
    normalized.key = this.config.key;
    normalized.cases = this.config.cases.map((item) => ({ ...item }));
    this.configChange.emit({ type, config: cloneSwitchConfig(normalized), previousCaseIds: previousIds });
  }
}
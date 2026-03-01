import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { GFlowLink, GFlowNode, JsonValue } from '../../core/gflow.types';

export interface SardineConfig { documentTypes: string[]; }
export interface SardineDocumentOption { label: string; value: string; }

export const SARDINE_DOCUMENT_OPTIONS: SardineDocumentOption[] = [
  { label: 'Facture', value: 'facture' },
  { label: 'Bulletin de salaire', value: 'bulletin' },
  { label: 'Contrat', value: 'contrat' },
  { label: 'Relevé bancaire', value: 'releve' },
  { label: 'Justificatif de domicile', value: 'justificatif' },
  { label: 'Pièce d’identité', value: 'identite' },
];

export const createSardineConfig = (): SardineConfig => ({ documentTypes: [] });

const isSardineConfig = (value: unknown): value is Partial<SardineConfig> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeDocumentTypes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean)));
  }
  if (isSardineConfig(value) && Array.isArray(value.documentTypes)) return normalizeDocumentTypes(value.documentTypes);
  return [];
};

const ensureOutputs = (node: GFlowNode) => {
  if (!Array.isArray(node.outputs)) node.outputs = [];
  if (node.outputs.length < 2) node.outputs = Array.from({ length: 2 }, (_, index) => node.outputs?.[index] ?? {});
};

const createOutputMap = (status: string, documentTypes: string[]): JsonValue => ({
  sardine: { status, type: 'SARDINE_FILE_TYPE', documents: [...documentTypes] },
});

const syncSardineOutputs = (node: GFlowNode, config: SardineConfig) => {
  ensureOutputs(node);
  const documents = [...config.documentTypes];
  node.outputs![0] = { ...node.outputs![0], name: 'valide', map: createOutputMap('success', documents) };
  node.outputs![1] = { ...node.outputs![1], name: 'invalide', map: createOutputMap('error', documents) };
};

export const ensureSardineConfig = (node: GFlowNode): SardineConfig => {
  const normalized: SardineConfig = { documentTypes: normalizeDocumentTypes(node.config) };
  node.config = normalized;
  node.configured = normalized.documentTypes.length > 0;
  syncSardineOutputs(node, normalized);
  return normalized;
};

export const applySardineConfig = (node: GFlowNode, documentTypes: string[]): SardineConfig => {
  const normalized: SardineConfig = { documentTypes: normalizeDocumentTypes(documentTypes) };
  node.config = normalized;
  node.configured = normalized.documentTypes.length > 0;
  syncSardineOutputs(node, normalized);
  return { documentTypes: [...normalized.documentTypes] };
};

@Component({
  selector: 'app-config-sardine',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule],
  template: `
    <div class="config-panel">
      <div class="config-line">
        <span class="line-label">Types de documents</span>
        <p-multiSelect
          [options]="options" size="small" optionLabel="label" optionValue="value" display="chip"
          [showClear]="true" defaultLabel="Sélectionner" [(ngModel)]="selected" (onChange)="emit()"
          appendTo="body" [style]="{'width':'100%'}"
        ></p-multiSelect>
      </div>
      
      <p class="warning" *ngIf="!selected.length">
        <i class="pi pi-exclamation-triangle"></i>
        Sélectionnez au moins un type pour activer le nœud.
      </p>
    </div>
  `,
  styles: [`
    .config-panel { display: flex; flex-direction: column; gap: 1rem; }
    .config-line { display: flex; flex-direction: column; gap: 0.25rem; }
    .line-label { font-weight: 500; font-size: 0.875rem; color: var(--p-text-color); }
    .warning { font-size: 0.85rem; color: var(--red-500); display: flex; align-items: center; gap: 0.5rem; margin: 0; }
  `],
})
export class ConfigSardine implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Input() inputMap: JsonValue | null = null;
  @Output() configChange = new EventEmitter<unknown>();

  options = SARDINE_DOCUMENT_OPTIONS;
  selected: string[] = [];

  ngOnInit() { this.syncFromNode(); }
  ngOnChanges(changes: SimpleChanges) { if (changes['node']) this.syncFromNode(); }

  private syncFromNode() {
    if (!this.node) { this.selected = []; return; }
    const cfg = ensureSardineConfig(this.node);
    this.selected = [...cfg.documentTypes];
    this.configChange.emit({ documentTypes: [...this.selected] });
  }

  emit() {
    if (!this.node) return;
    const snapshot = applySardineConfig(this.node, this.selected);
    this.selected = [...snapshot.documentTypes];
    this.configChange.emit(snapshot);
  }
}
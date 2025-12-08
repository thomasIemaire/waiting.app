import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { GFlowLink, GFlowNode } from '../../core/gflow.types';

export interface MergeInputConfig { index: number; enabled: boolean; }
export interface MergeConfig { inputs: MergeInputConfig[]; }

const isMergeConfig = (value: unknown): value is Partial<MergeConfig> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeInputs = (value: unknown, count: number): MergeInputConfig[] => {
  const defaults = Array.from({ length: count }, (_, index) => ({ index, enabled: true }));
  if (!isMergeConfig(value) || !Array.isArray((value as any).inputs)) return defaults;

  const map = new Map<number, boolean>();
  for (const entry of (value as any).inputs) {
    if (entry && typeof entry === 'object' && typeof (entry as any).index === 'number') {
      map.set(Number((entry as any).index), Boolean((entry as any).enabled ?? true));
    }
  }
  return defaults.map((item) => ({
    index: item.index,
    enabled: map.has(item.index) ? Boolean(map.get(item.index)) : item.enabled,
  }));
};

export const createMergeConfig = (count = 1): MergeConfig => ({
  inputs: Array.from({ length: count }, (_, index) => ({ index, enabled: true })),
});

export const ensureMergeConfig = (node: GFlowNode): MergeConfig => {
  const count = node.inputs?.length ?? 0;
  const normalized: MergeConfig = { inputs: sanitizeInputs(node.config, count) };
  node.config = normalized;
  node.configured = normalized.inputs.some((entry) => entry.enabled);
  return normalized;
};

export const applyMergeConfig = (node: GFlowNode, inputs: MergeInputConfig[]): MergeConfig => {
  const count = node.inputs?.length ?? 0;
  const map = new Map<number, boolean>();
  for (const entry of inputs) map.set(entry.index, Boolean(entry.enabled));

  const normalized: MergeConfig = {
    inputs: Array.from({ length: count }, (_, index) => ({ index, enabled: map.get(index) ?? true }))
  };
  node.config = normalized;
  node.configured = normalized.inputs.some((entry) => entry.enabled);
  return { inputs: normalized.inputs.map((entry) => ({ ...entry })) };
};

interface MergeInputView {
  index: number;
  label: string;
  enabled: boolean;
  connected: GFlowNode | null;
}

@Component({
  selector: 'app-config-merge',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule],
  template: `
    <div class="config-panel">
      <div class="block-header">
        <span class="block-label">Entrées actives</span>
      </div>

      <div class="block-card" *ngIf="inputs.length; else empty">
        <div class="inputs-list">
          <div class="input-row" *ngFor="let entry of inputs">
            <p-checkbox binary="true" [(ngModel)]="entry.enabled" (onChange)="emit()"></p-checkbox>
            <div class="input-info">
              <span class="input-title">{{ entry.label }}</span>
              <span class="input-detail" *ngIf="entry.connected as connected; else noLink">
                lié à <strong>{{ connected.name }}</strong>
              </span>
              <ng-template #noLink><span class="input-detail muted">non relié</span></ng-template>
            </div>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="block-card">
          <p class="warning">Aucune entrée disponible pour ce nœud.</p>
        </div>
      </ng-template>

      <p class="warning" *ngIf="inputs.length && !hasEnabled">
        Au moins une entrée doit être sélectionnée.
      </p>
    </div>
  `,
  styles: [`
    .config-panel { display: flex; flex-direction: column; gap: 0.5rem; }
    .block-header { margin-bottom: 0.25rem; }
    .block-label { font-weight: 700; font-size: 0.9rem; color: var(--p-text-color); }

    .block-card {
      background-color: var(--background-color-100);
      border-radius: var(--radius-m);
      padding: 0.75rem;
      border: 1px solid var(--background-color-200);
    }

    .inputs-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .input-row { display: flex; gap: 0.75rem; align-items: center; }
    
    .input-info { display: flex; flex-direction: column; font-size: 0.85rem; }
    .input-title { font-weight: 600; }
    .input-detail { font-size: 0.75rem; color: var(--p-text-muted-color); }
    .muted { font-style: italic; opacity: 0.7; }
    
    .warning { color: var(--red-500); font-size: 0.85rem; margin-top: 0.5rem; }
  `],
})
export class ConfigMerge implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Output() configChange = new EventEmitter<MergeConfig>();

  inputs: MergeInputView[] = [];
  get hasEnabled() { return this.inputs.some((entry) => entry.enabled); }

  ngOnInit() { this.syncFromNode(); }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['node'] || changes['nodes'] || changes['links']) this.syncFromNode();
  }

  private syncFromNode() {
    if (!this.node) { this.inputs = []; return; }
    const cfg = ensureMergeConfig(this.node);
    const map = new Map(cfg.inputs.map((entry) => [entry.index, entry.enabled] as [number, boolean]));

    this.inputs = Array.from({ length: this.node.inputs?.length ?? 0 }, (_, index) => {
      const link = this.links.find(lk => lk.relation === 'io' && lk.dst.nodeId === this.node.id && lk.dst.portIndex === index);
      const connected = link ? this.nodes.find((n) => n.id === link.src.nodeId) ?? null : null;
      return {
        index,
        label: this.node.inputs?.[index]?.name || `Entrée ${index + 1}`,
        enabled: map.get(index) ?? true,
        connected,
      };
    });
    this.emit();
  }

  emit() {
    if (!this.node) return;
    const snapshot = applyMergeConfig(this.node, this.inputs.map((e) => ({ index: e.index, enabled: e.enabled })));
    this.syncViewFromConfig(snapshot);
    this.configChange.emit(snapshot);
  }

  private syncViewFromConfig(config: MergeConfig) {
    const enabledMap = new Map(config.inputs.map((entry) => [entry.index, entry.enabled] as [number, boolean]));
    this.inputs = this.inputs.map((entry) => ({ ...entry, enabled: enabledMap.get(entry.index) ?? entry.enabled }));
  }
}
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { GFlowLink, GFlowNode } from '../../core/gflow.types';

export interface MergeInputConfig {
  index: number;
  enabled: boolean;
}

export interface MergeConfig {
  inputs: MergeInputConfig[];
}

const isMergeConfig = (value: unknown): value is Partial<MergeConfig> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeInputs = (value: unknown, count: number): MergeInputConfig[] => {
  const defaults = Array.from({ length: count }, (_, index) => ({ index, enabled: true }));
  if (!isMergeConfig(value) || !Array.isArray((value as any).inputs)) {
    return defaults;
  }

  const map = new Map<number, boolean>();
  for (const entry of (value as any).inputs) {
    if (entry && typeof entry === 'object' && typeof (entry as any).index === 'number') {
      const idx = Number((entry as any).index);
      map.set(idx, Boolean((entry as any).enabled ?? true));
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
  const normalized: MergeConfig = {
    inputs: sanitizeInputs(node.config, count),
  };

  node.config = normalized;
  node.configured = normalized.inputs.some((entry) => entry.enabled);
  return normalized;
};

export const applyMergeConfig = (node: GFlowNode, inputs: MergeInputConfig[]): MergeConfig => {
  const count = node.inputs?.length ?? 0;
  const map = new Map<number, boolean>();
  for (const entry of inputs) {
    map.set(entry.index, Boolean(entry.enabled));
  }

  const normalizedInputs = Array.from({ length: count }, (_, index) => ({
    index,
    enabled: map.has(index) ? Boolean(map.get(index)) : true,
  }));

  const normalized: MergeConfig = { inputs: normalizedInputs };
  node.config = normalized;
  node.configured = normalized.inputs.some((entry) => entry.enabled);
  return {
    inputs: normalized.inputs.map((entry) => ({ ...entry })),
  };
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
    <div class="config__wrapper" *ngIf="inputs.length; else empty">
      <p class="hint">Sélectionnez les entrées qui doivent être fusionnées.</p>
      <div class="entry" *ngFor="let entry of inputs">
        <p-checkbox
          binary="true"
          [(ngModel)]="entry.enabled"
          (onChange)="emit()"
        ></p-checkbox>
        <div class="entry__body">
          <div class="entry__title">{{ entry.label }}</div>
          <div class="entry__detail" *ngIf="entry.connected as connected; else noLink">
            {{ connected.name || 'Nœud' }}
          </div>
          <ng-template #noLink>
            <div class="entry__detail muted">Entrée non reliée</div>
          </ng-template>
        </div>
      </div>

      <p class="warning" *ngIf="!hasEnabled">Au moins une entrée doit être sélectionnée.</p>
    </div>
    <ng-template #empty>
      <p class="warning">Aucune entrée disponible pour ce nœud.</p>
    </ng-template>
  `,
  styles: [`
    .config__wrapper { display: grid; gap: .75rem; }
    .entry { display: grid; grid-template-columns: auto 1fr; gap: .5rem; align-items: center; padding: .5rem; border: 1px solid var(--surface-300); border-radius: .5rem; }
    .entry__title { font-weight: 600; }
    .entry__detail { font-size: .85rem; }
    .muted { opacity: .7; font-style: italic; }
    .warning { color: var(--red-500); font-size: .85rem; }
    .hint { font-size: .85rem; opacity: .75; }
  `],
})
export class ConfigMerge implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];

  @Output() configChange = new EventEmitter<MergeConfig>();

  inputs: MergeInputView[] = [];

  get hasEnabled() {
    return this.inputs.some((entry) => entry.enabled);
  }

  ngOnInit() {
    this.syncFromNode();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node'] || changes['nodes'] || changes['links']) {
      this.syncFromNode();
    }
  }

  private syncFromNode() {
    if (!this.node) {
      this.inputs = [];
      return;
    }

    const cfg = ensureMergeConfig(this.node);
    const map = new Map(cfg.inputs.map((entry) => [entry.index, entry.enabled] as [number, boolean]));

    this.inputs = Array.from({ length: this.node.inputs?.length ?? 0 }, (_, index) => {
      const link = this.links.find(
        (lk) =>
          lk.relation === 'io' &&
          lk.dst.nodeId === this.node.id &&
          lk.dst.kind === 'in' &&
          lk.dst.portIndex === index,
      );
      const connected = link ? this.nodes.find((n) => n.id === link.src.nodeId) ?? null : null;
      return {
        index,
        label: this.node.inputs?.[index]?.name || `Entrée ${index + 1}`,
        enabled: map.get(index) ?? true,
        connected,
      };
    });

    const snapshot = applyMergeConfig(
      this.node,
      this.inputs.map((entry) => ({ index: entry.index, enabled: entry.enabled })),
    );
    this.syncViewFromConfig(snapshot);
    this.configChange.emit(snapshot);
  }

  emit() {
    if (!this.node) {
      return;
    }

    const snapshot = applyMergeConfig(
      this.node,
      this.inputs.map((entry) => ({ index: entry.index, enabled: entry.enabled })),
    );
    this.syncViewFromConfig(snapshot);
    this.configChange.emit(snapshot);
  }

  private syncViewFromConfig(config: MergeConfig) {
    const enabledMap = new Map(config.inputs.map((entry) => [entry.index, entry.enabled] as [number, boolean]));
    this.inputs = this.inputs.map((entry) => ({
      ...entry,
      enabled: enabledMap.get(entry.index) ?? entry.enabled,
    }));
  }
}

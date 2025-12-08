import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { GFlowLink, GFlowNode, JsonValue } from '../../core/gflow.types';

export type EndStatus = 'success' | 'error' | 'warning' | 'info';
export interface EndConfig { message: string; status: EndStatus; }

export const END_STATUS_OPTIONS: { label: string; value: EndStatus }[] = [
  { label: 'Succès', value: 'success' },
  { label: 'Erreur', value: 'error' },
  { label: 'Avertissement', value: 'warning' },
  { label: 'Information', value: 'info' },
];

export const createEndConfig = (): EndConfig => ({ message: 'Fin du flux', status: 'success' });

const isEndConfig = (value: unknown): value is Partial<EndConfig> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeMessage = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const normalizeStatus = (value: unknown, fallback: EndStatus): EndStatus => {
  if (typeof value !== 'string') return fallback;
  return (END_STATUS_OPTIONS.find((option) => option.value === value)?.value ?? fallback) as EndStatus;
};

export const ensureEndConfig = (node: GFlowNode): EndConfig => {
  const defaults = createEndConfig();
  const cfg = node.config;
  const normalized: EndConfig = {
    message: normalizeMessage(isEndConfig(cfg) ? cfg.message : undefined, defaults.message),
    status: normalizeStatus(isEndConfig(cfg) ? cfg.status : undefined, defaults.status),
  };
  node.config = normalized;
  node.configured = Boolean(normalized.message);
  return normalized;
};

export const applyEndConfig = (node: GFlowNode, updates: Partial<EndConfig>): EndConfig => {
  const current = ensureEndConfig(node);
  const next: EndConfig = {
    message: normalizeMessage(updates.message ?? current.message, createEndConfig().message),
    status: normalizeStatus(updates.status ?? current.status, createEndConfig().status),
  };
  node.config = next;
  node.configured = Boolean(next.message);
  return { ...next };
};

@Component({
  selector: 'app-config-end',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule],
  template: `
    <div class="config-panel">
      <div class="config-line">
        <span class="line-label">Message de fin</span>
        <input pInputText pSize="small" [(ngModel)]="message" (ngModelChange)="emit()" placeholder="Message affiché" />
      </div>

      <div class="config-line">
        <span class="line-label">Statut final</span>
        <p-select size="small" [options]="statusOptions" optionLabel="label" optionValue="value"
          [(ngModel)]="status" (onChange)="emit()" appendTo="body" [style]="{'width':'100%'}" />
      </div>
    </div>
  `,
  styles: [`
    .config-panel { display: flex; flex-direction: column; gap: 1rem; }
    .config-line { display: flex; flex-direction: column; gap: 0.25rem; }
    .line-label { font-weight: 500; font-size: 0.875rem; color: var(--p-text-color); }
  `],
})
export class ConfigEnd implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Input() inputMap: JsonValue | null = null;
  @Output() configChange = new EventEmitter<EndConfig>();

  message = '';
  status: EndStatus = 'success';
  readonly statusOptions = END_STATUS_OPTIONS;

  ngOnInit() { this.syncFromNode(); }
  ngOnChanges(changes: SimpleChanges) { if (changes['node']) this.syncFromNode(); }

  private syncFromNode() {
    if (!this.node) return;
    const cfg = ensureEndConfig(this.node);
    this.message = cfg.message;
    this.status = cfg.status;
    this.configChange.emit({ ...cfg });
  }

  emit() {
    if (!this.node) return;
    const snapshot = applyEndConfig(this.node, { message: this.message, status: this.status });
    this.configChange.emit(snapshot);
  }
}
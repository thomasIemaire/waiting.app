import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { GFlowLink, GFlowNode, JsonValue } from '../../core/gflow.types';

export interface AgentGroupConfig { map: Record<string, unknown>; ids: string[]; }
export const createAgentGroupConfig = (): AgentGroupConfig => ({ map: {}, ids: [] });

const isAgentGroupConfig = (value: unknown): value is AgentGroupConfig =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneMap = (value: Record<string, unknown>): Record<string, unknown> => JSON.parse(JSON.stringify(value));

export const ensureAgentGroupConfig = (node: GFlowNode): AgentGroupConfig => {
  const cfg = node.config as AgentGroupConfig | undefined;
  if (!isAgentGroupConfig(cfg)) node.config = createAgentGroupConfig();
  const normalized = node.config as AgentGroupConfig;
  normalized.map ??= {};
  normalized.ids ??= [];
  return normalized;
};

export const updateAgentGroupConfig = (node: GFlowNode, updates: Partial<AgentGroupConfig>): AgentGroupConfig => {
  const cfg = ensureAgentGroupConfig(node);
  if (updates.map) cfg.map = cloneMap(updates.map);
  if (updates.ids) cfg.ids = [...updates.ids];
  return { map: cloneMap(cfg.map), ids: [...cfg.ids] };
};

interface AgentGroupRow { agent: GFlowNode | null; index: number; }

@Component({
  selector: 'app-config-agent-group',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
  <div class="config-panel">
    <div class="block-header">
      <span class="block-label">Agents connectés</span>
    </div>

    <div class="block-card">
      <div class="rows">
        <div class="row" *ngFor="let row of view; let i = index; trackBy: trackByFn">
          <div class="entry-col">Entrée {{ i + 1 }}</div>
          <div class="arrow">⟶</div>
          <div class="agent-col" [class.missing]="!row.agent">
            <ng-container *ngIf="row.agent as agent; else noLink">
              <strong>{{ agent.name || 'Agent' }}</strong>
              <span class="muted">
                ({{ $any(agent.config)?.agentName || 'n/a' }} v{{ $any(agent.config)?.version || '?' }})
              </span>
            </ng-container>
            <ng-template #noLink><em>En attente de connexion...</em></ng-template>
          </div>
          <div class="tools">
            <p-button size="small" severity="danger" text icon="pi pi-trash" (click)="remove(i)" />
          </div>
        </div>
      </div>

      <div class="add-row">
        <p-button size="small" severity="secondary" icon="pi pi-plus" label="Ajouter un slot" text (click)="add()" />
      </div>
    </div>
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

    .rows { display: flex; flex-direction: column; gap: 0.5rem; }
    .row {
      display: grid;
      grid-template-columns: 80px 24px 1fr 32px;
      align-items: center;
      padding: 0.25rem 0;
      border-bottom: 1px solid var(--background-color-200);
    }
    .row:last-child { border-bottom: none; }

    .entry-col { font-weight: 600; font-size: 0.85rem; color: var(--p-text-muted-color); }
    .arrow { color: var(--p-text-muted-color); }
    .agent-col { font-size: 0.9rem; }
    .agent-col .muted { opacity: 0.7; font-size: 0.8rem; margin-left: 0.25rem; }
    .agent-col.missing { opacity: 0.6; font-style: italic; font-size: 0.8rem; }

    .add-row { margin-top: 0.75rem; display: flex; justify-content: center; }
  `]
})
export class ConfigAgentGroup implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Input() inputMap: JsonValue | null = null;
  @Output() configChange = new EventEmitter<unknown>();

  public view: AgentGroupRow[] = [];

  ngOnInit() { this.refresh(); }
  ngOnChanges(_c: SimpleChanges) { this.refresh(); }

  add() {
    this.node.entries ??= [];
    this.node.entries.push({});
    this.persistIds();
    this.configChange.emit({ type: 'entries-changed' });
  }

  remove(i: number) {
    this.configChange.emit({ type: 'entry-removed', index: i });
  }

  // Correction : Ajout de la fonction trackBy
  trackByFn(index: number, item: AgentGroupRow) {
    return index; // L'index est suffisant ici car l'ordre importe et c'est une liste simple
  }

  private refresh() {
    if (!this.node) return;
    const cnt = this.node.entries?.length ?? 0;
    const children: string[] = [];

    this.view = Array.from({ length: cnt }).map((_, idx) => {
      const lk = this.links.find(l =>
        l.relation === 'entry-exit' &&
        l.src.nodeId === this.node.id && l.src.kind === 'entry' && l.src.portIndex === idx &&
        l.dst.kind === 'exit'
      );
      const child = lk ? (this.nodes.find(n => n.id === lk.dst.nodeId) || null) : null;
      if (child) children.push(child.id);
      return { agent: child, index: idx };
    });

    updateAgentGroupConfig(this.node, { ids: children });
  }

  private persistIds() { ensureAgentGroupConfig(this.node); }
}
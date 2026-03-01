import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Ajout
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext'; // Ajout
import { GFlowLink, GFlowNode, JsonValue } from '../../core/gflow.types';

export interface AgentGroupConfig { map: Record<string, unknown>; ids: string[]; root?: string; }
export const createAgentGroupConfig = (): AgentGroupConfig => ({ map: {}, ids: [], root: '' });

const isAgentGroupConfig = (value: unknown): value is AgentGroupConfig =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneMap = (value: Record<string, unknown>): Record<string, unknown> => JSON.parse(JSON.stringify(value));

export const ensureAgentGroupConfig = (node: GFlowNode): AgentGroupConfig => {
  const cfg = node.config as AgentGroupConfig | undefined;
  if (!isAgentGroupConfig(cfg)) node.config = createAgentGroupConfig();
  const normalized = node.config as AgentGroupConfig;
  normalized.map ??= {};
  normalized.ids ??= [];
  normalized.root ??= ''; // Init root
  return normalized;
};

export const updateAgentGroupConfig = (node: GFlowNode, updates: Partial<AgentGroupConfig>): AgentGroupConfig => {
  const cfg = ensureAgentGroupConfig(node);
  if (updates.map) cfg.map = cloneMap(updates.map);
  if (updates.ids) cfg.ids = [...updates.ids];
  if (updates.root !== undefined) cfg.root = updates.root; // Update root
  return { map: cloneMap(cfg.map), ids: [...cfg.ids], root: cfg.root };
};

interface AgentGroupRow { agent: GFlowNode | null; index: number; }

@Component({
  selector: 'app-config-agent-group',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule, InputTextModule], // Ajout imports
  template: `
  <div class="config-panel">
    <div class="config-line">
      <span class="line-label">Racine du résultat (Optionnel)</span>
      <input pInputText type="text" pSize="small" placeholder="ex: global.extraction" 
             [(ngModel)]="root" (ngModelChange)="onRootChange()" style="width: 100%" />
    </div>

    <div class="block-header" style="margin-top: 1rem;">
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
    .config-line { display: flex; flex-direction: column; gap: 0.25rem; }
    .line-label { font-weight: 500; font-size: 0.875rem; color: var(--p-text-color); }
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
  public root: string = ''; // Local root state

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

  trackByFn(index: number, item: AgentGroupRow) {
    return index;
  }

  onRootChange() {
    updateAgentGroupConfig(this.node, { root: this.root });
    this.configChange.emit({ type: 'root-changed' });
  }

  private refresh() {
    if (!this.node) return;
    
    // Sync root
    const cfg = ensureAgentGroupConfig(this.node);
    this.root = cfg.root || '';

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
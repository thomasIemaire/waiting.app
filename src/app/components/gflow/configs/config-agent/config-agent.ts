import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { GFlowLink, GFlowNode, GFlowPort, JsonValue } from '../../core/gflow.types';
import { ApiService } from '../../../../core/services/api.service';

export interface AgentVersion { version: string; map: JsonValue; }
export interface AgentDefinition { name: string; versions: AgentVersion[]; }
export interface AgentConfig { agentName: string; version: string; }

const compareVersions = (a: string, b: string): number => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (nb > na) return -1;
  }
  return 0;
};

const cloneJson = <T extends JsonValue>(value: T): T => JSON.parse(JSON.stringify(value));

export const ensureAgentConfig = (node: GFlowNode): AgentConfig => {
  const cfg = (node.config as AgentConfig | undefined) ?? { agentName: '', version: '' };
  const normalized: AgentConfig = { agentName: cfg.agentName || '', version: cfg.version || '' };
  node.config = normalized;
  return normalized;
};

const resolveMapForVersion = (agentDef: AgentDefinition, version: string): JsonValue => {
  if (!agentDef || !agentDef.versions.length) return {};
  let targetVersion = version;
  if (version === 'latest') {
    const sorted = [...agentDef.versions].sort((a, b) => compareVersions(b.version, a.version));
    if (sorted.length > 0) return cloneJson(sorted[0].map);
  }
  const verObj = agentDef.versions.find((v) => v.version === targetVersion);
  return verObj ? cloneJson(verObj.map) : {};
};

export const createAgentOutputPorts = (): GFlowPort[] => [{ map: {} }];

@Component({
  selector: 'app-config-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  template: `
  <div class="config-panel">
    <div class="config-line">
      <span class="line-label">Modèle d'IA</span>
      <p-select
        [options]="agents" optionLabel="name" optionValue="name" size="small"
        placeholder="Choisir un agent" [filter]="true"
        [(ngModel)]="selectedAgentName" (onChange)="onAgentChange($event.value)"
        appendTo="body" [style]="{'width':'100%'}" />
    </div>

    <div class="config-line">
      <span class="line-label">Version cible</span>
      <p-select
        [options]="availableVersions" optionLabel="label" optionValue="value" size="small"
        placeholder="Version" [(ngModel)]="selectedVersion" 
        (onChange)="onVersionChange($event.value)" [disabled]="!selectedAgentName"
        appendTo="body" [style]="{'width':'100%'}" />
    </div>
  </div>`,
  styles: [`
    .config-panel { display: flex; flex-direction: column; gap: 1rem; }
    .config-line { display: flex; flex-direction: column; gap: 0.25rem; }
    .line-label { font-weight: 500; font-size: 0.875rem; color: var(--p-text-color); }
  `]
})
export class ConfigAgent implements OnInit, OnChanges {
  @Input() node!: GFlowNode;
  @Input() nodes: GFlowNode[] = [];
  @Input() links: GFlowLink[] = [];
  @Input() inputMap: JsonValue | null = null;
  @Output() configChange = new EventEmitter<unknown>();

  private api = inject(ApiService);
  public agents: AgentDefinition[] = [];
  public selectedAgentName = '';
  public selectedVersion = '';

  ngOnInit() { this.loadAgents(); }
  ngOnChanges(changes: SimpleChanges) { if (changes['node']) this.syncFromNode(); }

  private loadAgents() {
    this.api.get<any[]>('agents/').subscribe({
      next: (data) => {
        const map = new Map<string, AgentVersion[]>();
        data.forEach(doc => {
          const ref = doc.reference;
          if (!map.has(ref)) map.set(ref, []);
          map.get(ref)?.push({ version: doc.version, map: doc.mapper || {} });
        });
        this.agents = Array.from(map.entries()).map(([name, versions]) => ({
          name, versions: versions.sort((a, b) => compareVersions(b.version, a.version))
        }));
        this.syncFromNode();
      },
      error: (err) => console.error("Impossible de charger les agents", err)
    });
  }

  get availableVersions() {
    const agent = this.agents.find(a => a.name === this.selectedAgentName);
    if (!agent) return [];
    return [{ label: 'Latest', value: 'latest' }, ...agent.versions.map(v => ({ label: v.version, value: v.version }))];
  }

  private syncFromNode() {
    if (!this.node) return;
    const cfg = ensureAgentConfig(this.node);
    this.selectedAgentName = cfg.agentName;
    this.selectedVersion = cfg.version;
  }

  onAgentChange(name: string) {
    this.selectedAgentName = name;
    this.selectedVersion = 'latest';
    this.emitConfig();
  }

  onVersionChange(ver: string) {
    this.selectedVersion = ver;
    this.emitConfig();
  }

  private emitConfig() {
    const newConfig: AgentConfig = { agentName: this.selectedAgentName, version: this.selectedVersion };
    this.node.config = newConfig;
    this.node.configured = !!(this.selectedAgentName && this.selectedVersion);

    const agentDef = this.agents.find(a => a.name === this.selectedAgentName);
    if (agentDef) {
      const resolvedMap = resolveMapForVersion(agentDef, this.selectedVersion);
      if (!this.node.outputs || !this.node.outputs.length) this.node.outputs = [{ map: {} }];
      this.node.outputs[0] = { ...this.node.outputs[0], map: resolvedMap };
    }
    this.configChange.emit(newConfig);
  }
}
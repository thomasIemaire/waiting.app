import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// On garde vos imports PrimeNG ou on bascule sur du natif stylisé si vous préférez
// Ici je garde PrimeNG pour la cohérence fonctionnelle mais je change le layout
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { GFlowLink, GFlowNode, GFlowPort, JsonValue } from '../../core/gflow.types';
import { flattenInputKeys } from '../utils/input-map.utils';
import { BaseConfigComponent } from '../base-config.component'; // Si vous avez créé la classe de base

// ... (Vos interfaces et fonctions helpers restent identiques : Condition, IfConfig, createCondition...)
export interface Condition {
  left: string;
  operator: string;
  right: unknown;
  rightIsKey?: boolean;
  name?: string; // AJOUT : Nom optionnel du cas (ex: "Case name")
}

export interface IfConfig {
  conditions: Condition[];
}

export const createCondition = (): Condition => ({
  left: '',
  operator: '==',
  right: '',
  name: ''
});

// ... (cloneConditions, createIfConfig, ensureIfConfig, applyIfConditions, IF_OPERATORS inchangés) ...
export const cloneConditions = (conditions: Condition[]): Condition[] =>
  conditions.map((condition) => ({ ...condition }));

export const createIfConfig = (): IfConfig => ({
  conditions: [createCondition()],
});

const isIfConfig = (value: unknown): value is IfConfig =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const ensureIfConfig = (node: GFlowNode): IfConfig => {
  const cfg = node.config as IfConfig | undefined;
  const source = isIfConfig(cfg) && Array.isArray(cfg.conditions) && cfg.conditions.length
    ? cfg.conditions
    : createIfConfig().conditions;

  const normalized: IfConfig = {
    conditions: cloneConditions(source),
  };

  node.config = normalized;
  return normalized;
};

export const applyIfConditions = (node: GFlowNode, conditions: Condition[]): Condition[] => {
  const normalized = ensureIfConfig(node);
  const cloned = cloneConditions(conditions);
  normalized.conditions = cloned;
  return cloneConditions(cloned);
};

export const IF_OPERATORS = [
  { label: '==', value: '==' },
  { label: '!=', value: '!=' },
  { label: '>', value: '>' },
  { label: '>=', value: '>=' },
  { label: '<', value: '<' },
  { label: '<=', value: '<=' },
  { label: 'contains', value: 'contains' },
  // ...
];

@Component({
  selector: 'app-config-if',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, InputTextModule, ButtonModule],
  template: `
  <div class="config-panel">
    <div class="header">
      <div class="title-row">
        <h3>If / else</h3>
        <div class="header-actions">
          <i class="pi pi-book" title="Documentation"></i>
          <i class="pi pi-trash" title="Supprimer"></i>
        </div>
      </div>
      <p class="subtitle">Create conditions to branch your workflow</p>
    </div>

    <div class="conditions-list">
      <div class="condition-block" *ngFor="let c of conditions; let i = index">
        
        <div class="block-header">
          <span class="block-label">
            {{ i === 0 ? 'If' : 'Else if' }}
            <i *ngIf="i === 0" class="pi pi-exclamation-triangle text-orange-500 ml-1" style="font-size: 12px"></i>
          </span>
          <button class="btn-icon-sm" (click)="remove(i)" *ngIf="conditions.length > 1 || i > 0">
            <i class="pi pi-trash"></i>
          </button>
        </div>

        <div class="block-card">
          <input 
            type="text" 
            class="input-transparent w-full mb-2" 
            placeholder="Case name (optional)" 
            [(ngModel)]="c.name" 
            (change)="emit()"
          >

          <div class="logic-row">
            <select class="input-flat text-blue" [(ngModel)]="c.left" (change)="emit()">
              <option value="" disabled selected>Select variable</option>
              <option *ngFor="let k of keys" [value]="k">{{ k }}</option>
            </select>

            <select class="input-flat op-select" [(ngModel)]="c.operator" (change)="emit()">
              <option *ngFor="let op of operators" [value]="op.value">{{ op.label }}</option>
            </select>

            <div class="right-val-wrapper">
               <input 
                 *ngIf="!c.rightIsKey"
                 type="text" 
                 class="input-flat" 
                 placeholder="Value" 
                 [(ngModel)]="c.right" 
                 (change)="emit()"
               >
               <select 
                 *ngIf="c.rightIsKey"
                 class="input-flat text-blue" 
                 [(ngModel)]="c.right" 
                 (change)="emit()"
               >
                 <option *ngFor="let k of keys" [value]="k">{{ k }}</option>
               </select>
               
               <button class="toggle-mode-btn" (click)="c.rightIsKey = !c.rightIsKey; emit()" 
                       title="Switch value/variable">
                 <i class="pi" [class.pi-hashtag]="!c.rightIsKey" [class.pi-at]="c.rightIsKey"></i>
               </button>
            </div>
          </div>
          
          <div class="helper-text">
            Use Common Expression Language to create a custom expression. <a href="#">Learn more.</a>
          </div>
        </div>

      </div>
    </div>

    <button class="btn-add" (click)="add()">
      <i class="pi pi-plus"></i> Add
    </button>

  </div>
  `,
  styles: [`
    /* STYLE GLOBAL DU PANEL */
    .config-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* HEADER */
    .header .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .header-actions {
      display: flex;
      gap: 8px;
      color: #6b7280;
      cursor: pointer;
    }
    .header-actions i:hover { color: #374151; }
    .subtitle {
      margin: 0;
      font-size: 13px;
      color: #9ca3af;
    }

    /* BLOC CONDITION */
    .condition-block {
      margin-bottom: 16px;
    }
    .block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .block-label {
      font-weight: 600;
      font-size: 14px;
      color: #374151;
      display: flex;
      align-items: center;
    }
    .btn-icon-sm {
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      padding: 2px;
    }
    .btn-icon-sm:hover { color: #ef4444; }

    /* CARTE GRISE */
    .block-card {
      background-color: #f3f4f6; /* Gris clair */
      border-radius: 8px;
      padding: 12px;
      border: 1px solid transparent;
      transition: border-color 0.2s;
    }
    .block-card:focus-within {
      border-color: #d1d5db;
    }

    /* INPUTS CUSTOMS */
    .input-transparent {
      background: transparent;
      border: none;
      outline: none;
      font-size: 13px;
      color: #6b7280;
      width: 100%;
    }
    .input-transparent::placeholder { color: #9ca3af; }

    .input-flat {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 13px;
      outline: none;
      width: 100%;
      color: #374151;
    }
    .input-flat:focus { border-color: #3b82f6; }
    .text-blue { color: #2563eb; font-family: monospace; }

    /* LOGIC ROW LAYOUT */
    .logic-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }
    .logic-row select { height: 28px; }
    .op-select { width: 60px; flex-shrink: 0; }
    
    .right-val-wrapper {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }
    .toggle-mode-btn {
      position: absolute;
      right: 4px;
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 10px;
    }
    .toggle-mode-btn:hover { color: #3b82f6; }

    .helper-text {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.4;
    }
    .helper-text a { color: #6b7280; text-decoration: underline; }

    /* ADD BUTTON */
    .btn-add {
      background-color: #e5e7eb;
      border: none;
      border-radius: 16px; /* Pill shape */
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-add:hover { background-color: #d1d5db; }
    .btn-add i { font-size: 10px; }
  `]
})
export class ConfigIf extends BaseConfigComponent implements OnInit, OnChanges {
  public conditions: Condition[] = [];
  public keys: string[] = [];
  public operators = IF_OPERATORS;

  ngOnInit() { this.syncFromNode(); this.refreshKeys(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node']) this.syncFromNode();
    if (changes['inputMap']) this.refreshKeys();
  }

  private syncFromNode() {
    const cfg = ensureIfConfig(this.node);
    this.conditions = cloneConditions(cfg.conditions);
  }

  private refreshKeys() {
    this.keys = flattenInputKeys(this.inputMap);
  }

  add() {
    // 1. Créer la nouvelle condition
    this.conditions.push(createCondition());

    // 2. Créer le nouveau port
    // On donne un nom temporaire ou vide, il sera mis à jour par le emit()
    const newPort: GFlowPort = { name: `Case ${this.conditions.length}` } as GFlowPort;

    // 3. Insérer le port AVANT le dernier élément (qui est le port "Else")
    // On utilise splice pour insérer à l'index (longueur - 1)
    const insertIndex = this.node.outputs.length - 1;
    this.node.outputs.splice(insertIndex, 0, newPort);

    // 4. Sauvegarder
    this.emit();
  }

  remove(i: number) {
    // 1. Supprimer la condition à l'index i
    this.conditions.splice(i, 1);

    // 2. Supprimer le port de sortie correspondant à l'index i
    // splice(index, nombre_a_supprimer)
    this.node.outputs.splice(i, 1);

    // 3. Sauvegarder
    this.emit();
  }

  emit() {
    const snapshot = applyIfConditions(this.node, this.conditions);
    this.configChange.emit(snapshot);
  }
}
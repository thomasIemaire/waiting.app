import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { GFlowNode, JsonValue } from '../../core/gflow.types';
import { flattenInputKeys } from '../utils/input-map.utils';
import { BaseConfigComponent } from '../base-config.component';
import { TooltipModule } from 'primeng/tooltip';

export interface Rule {
  left: string;
  operator: string;
  right: any;
  rightIsKey?: boolean;
  // L'opérateur logique vers la règle suivante (ex: 'AND', 'OR')
  link?: 'AND' | 'OR';
}

export interface Condition {
  name?: string;
  // On garde logic pour rétrocompatibilité backend, mais l'UI utilise rule.link
  logic: 'AND' | 'OR' | 'MIXED';
  rules: Rule[];
}

export interface IfConfig {
  conditions: Condition[];
}

export const createRule = (): Rule => ({
  left: '',
  operator: '==',
  right: '',
  rightIsKey: false,
  link: 'AND'
});

export const createCondition = (): Condition => ({
  name: '',
  logic: 'AND',
  rules: [createRule()]
});

export const cloneConditions = (conditions: Condition[]): Condition[] =>
  conditions.map((condition) => ({
    ...condition,
    rules: (condition.rules || []).map(r => ({ ...r }))
  }));

export const createIfConfig = (): IfConfig => ({
  conditions: [createCondition()],
});

const isIfConfig = (value: unknown): value is IfConfig =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const ensureIfConfig = (node: GFlowNode): IfConfig => {
  const cfg = node.config as IfConfig | undefined;

  const hasConditions = isIfConfig(cfg) && Array.isArray(cfg.conditions) && cfg.conditions.length > 0;

  const source = hasConditions && cfg
    ? cfg.conditions
    : createIfConfig().conditions;

  const safeConditions = source.map(c => ({
    ...c,
    rules: Array.isArray(c.rules) ? c.rules : [createRule()]
  }));

  const normalized: IfConfig = {
    conditions: cloneConditions(safeConditions),
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
  { label: '=', value: '==' },
  { label: '≠', value: '!=' },
  { label: '>', value: '>' },
  { label: '≥', value: '>=' },
  { label: '<', value: '<' },
  { label: '≤', value: '<=' },
  { label: 'contient', value: 'contains' },
];

export const LOGIC_LINKS = [
  { label: 'ET', value: 'AND' },
  { label: 'OU', value: 'OR' }
];

@Component({
  selector: 'app-config-if',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, InputTextModule, ButtonModule, TooltipModule],
  template: `
  <div class="config-panel">
    <div class="conditions-list">
      
      <div class="condition-block" *ngFor="let c of conditions; let i = index">
        
        <div class="block-header">
          <span class="block-label">
            {{ i === 0 ? 'Si (If)' : 'Sinon Si (Else If)' }}
          </span>
          <p-button icon="pi pi-trash" severity="danger" text rounded size="small" 
                    (click)="remove(i)" *ngIf="conditions.length > 1 || i > 0" 
                    pTooltip="Supprimer ce bloc" tooltipPosition="left"></p-button>
        </div>

        <div class="block-card">
          
          <div class="rules-container">
            <ng-container *ngFor="let rule of c.rules; let ri = index">
              
              <div class="rule-grid">
                <div class="col-var">
                   <p-select [options]="keys" [(ngModel)]="rule.left" [editable]="true" 
                             placeholder="Variable" size="small" appendTo="body" 
                             (onChange)="emit()" [style]="{'width': '100%'}"></p-select>
                </div>

                <div class="col-op">
                   <p-select [options]="operators" [(ngModel)]="rule.operator" 
                             optionLabel="label" optionValue="value" size="small" 
                             appendTo="body" (onChange)="emit()" 
                             [style]="{'width': '100%'}"></p-select>
                </div>

                <div class="col-val">
                    <div class="right-val-wrapper">
                        <input *ngIf="!rule.rightIsKey" pInputText type="text" class="input-flat"  pSize="small"
                               [(ngModel)]="rule.right" (change)="emit()" placeholder="Valeur">
                        
                        <p-select *ngIf="rule.rightIsKey" [options]="keys" [(ngModel)]="rule.right" 
                                  [editable]="true" size="small" appendTo="body" 
                                  (onChange)="emit()" [style]="{'width': '100%'}"></p-select>
                        
                        <button class="toggle-mode-btn" (click)="rule.rightIsKey = !rule.rightIsKey; emit()" 
                                [pTooltip]="rule.rightIsKey ? 'Utiliser une valeur brute' : 'Utiliser une variable'" 
                                tooltipPosition="top">
                          <i class="pi" [class.pi-pencil]="rule.rightIsKey" [class.pi-at]="!rule.rightIsKey"></i>
                        </button>
                    </div>
                </div>

                <div class="col-action">
                   <p-button icon="pi pi-times" severity="danger" text size="small" 
                             (click)="c.rules.splice(ri, 1); emit()" 
                             *ngIf="c.rules.length > 1"></p-button>
                </div>
              </div>

              <div class="logic-connector" *ngIf="ri < c.rules.length - 1">
                  <div class="connector-line"></div>
                  <p-select [options]="logicLinks" [(ngModel)]="rule.link" 
                            optionLabel="label" optionValue="value"
                            size="small" appendTo="body" (onChange)="emit()" 
                            styleClass="tiny-select"></p-select>
                  <div class="connector-line"></div>
              </div>

            </ng-container>
          </div>

          <div class="add-rule-row">
             <p-button label="Ajouter une condition" icon="pi pi-plus" size="small" severity="secondary" text 
                       (click)="addRule(c)"></p-button>
          </div>

        </div>

      </div>
    </div>

    <p-button icon="pi pi-plus" label="Ajouter un bloc 'Sinon Si'" size="small" severity="secondary" 
              (click)="addBlock()" styleClass="w-full"></p-button>

  </div>
  `,
  styles: [`
    .config-panel {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .condition-block {
      margin-bottom: 0.5rem;
    }

    .block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .block-label {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--p-text-color);
    }

    .block-card {
      background-color: var(--background-color-100);
      border-radius: var(--radius-m);
      padding: 0.75rem;
      border: 1px solid var(--background-color-200);
    }

    /* GRID SYSTEM FOR RULES */
    .rules-container {
      display: flex;
      flex-direction: column;
    }

    .rule-grid {
      display: grid;
      /* Var (35%) Op (15%) Val (40%) Del (10%) */
      grid-template-columns: 1fr 70px 1fr 32px; 
      gap: 0.5rem;
      align-items: center;
    }

    /* INPUTS & WRAPPERS */
    .right-val-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .input-flat {
      width: 100%;
    }
    
    .toggle-mode-btn {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--p-text-muted-color);
      cursor: pointer;
      font-size: 0.75rem;
      z-index: 10;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toggle-mode-btn:hover { 
        color: var(--p-primary-color); 
        background-color: var(--background-color-200);
    }

    /* LOGIC CONNECTOR */
    .logic-connector {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }
    .connector-line {
      flex: 1;
      height: 1px;
      background-color: var(--background-color-300);
    }
    ::ng-deep .tiny-select .p-select-label {
        padding: 0.2rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .add-rule-row {
      margin-top: 0.75rem;
      display: flex;
      justify-content: center;
    }
    
    ::ng-deep .w-full { width: 100%; }
  `]
})
export class ConfigIf extends BaseConfigComponent implements OnInit, OnChanges {
  public conditions: Condition[] = [];
  public keys: string[] = [];
  public operators = IF_OPERATORS;
  public logicLinks = LOGIC_LINKS;

  ngOnInit() { this.syncFromNode(); this.refreshKeys(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node']) this.syncFromNode();
    if (changes['inputMap']) this.refreshKeys();
  }

  private syncFromNode() {
    if (!this.node) return;
    const cfg = ensureIfConfig(this.node);
    this.conditions = cloneConditions(cfg.conditions);
  }

  private refreshKeys() {
    this.keys = flattenInputKeys(this.inputMap);
  }

  createRule(): Rule {
    return createRule();
  }

  // Ajoute une règle à l'intérieur d'un bloc existant
  addRule(condition: Condition) {
    condition.rules.push(this.createRule());
    this.emit();
  }

  // Ajoute un nouveau bloc complet (Case)
  addBlock() {
    this.conditions.push(createCondition());
    const newPort = { name: `Case ${this.conditions.length}` } as any;

    if (!this.node.outputs) {
      this.node.outputs = [];
    }

    const insertIndex = Math.max(0, this.node.outputs.length - 1);
    this.node.outputs.splice(insertIndex, 0, newPort);

    this.emit();
  }

  remove(i: number) {
    this.conditions.splice(i, 1);
    if (this.node.outputs && this.node.outputs.length > i) {
      this.node.outputs.splice(i, 1);
    }
    this.emit();
  }

  emit() {
    if (!this.node) return;
    const snapshot = applyIfConditions(this.node, this.conditions);
    this.configChange.emit(snapshot);
  }
}
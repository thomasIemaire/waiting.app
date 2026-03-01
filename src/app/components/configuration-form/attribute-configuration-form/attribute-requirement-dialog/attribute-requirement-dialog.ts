import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig, DynamicDialogModule } from 'primeng/dynamicdialog';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputWLabelComponent } from "../../../input-w-label/input-w-label.component";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DynamicDialogModule, Select, InputWLabelComponent],
  template: `
    <div>
      <div class="form__wrapper">
        <div class="form__inputs-group">
          <div class="input-w-label">
            <span class="input-label">Règle</span>
            <p-select size="small" [(ngModel)]="temp.rule" optionLabel="label" optionValue="value" placeholder="Règle" [options]="RuleOptions" appendTo="body" />
          </div>
          <app-input-w-label label="Contrainte" [(value)]="temp.constraint" />
        </div>

        <div class="group-inputs" *ngIf="temp.rule === 'regex'">
          <div class="group-link">
            Tester
            <a class="link" [href]="regexHelpLink" target="_blank">
              ici
              <i class="pi pi-arrow-up-right"></i>
            </a>
          </div>
        </div>

        <div class="group-inputs" *ngIf="temp.rule === 'in' || temp.rule === 'nin'">
          <div class="group-link">
            exemple : valeur, valeur, valeur
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <p-button size="small" text severity="secondary" label="Annuler" (click)="close()"></p-button>
        <p-button size="small" label="Enregistrer" (click)="ref.close(temp)"></p-button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .group-link {
        width: 100%;
        font-size: .875rem;
        color: var(--p-text-color);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: .25rem;

        .link {
            display: flex;
            align-items: center;
            gap: .25rem;
            font-weight: 600;
            color: var(--p-text-color);
            cursor: pointer;
            text-decoration: none;

            .pi {
                font-size: .625rem;
            }
        }
    }

    .form__wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: .5rem;

        .group-inputs {
            width: 100%;
            display: flex;
            align-items: center;
            gap: .5rem;

            .p-inputtext {
                width: 100%;
            }
        }

        p-button {
            width: min-content;
        }
    }
    `]
})
export class AttributeRequirementDialog {
  public temp: any;

  constructor(public ref: DynamicDialogRef, public cfg: DynamicDialogConfig) {
    this.temp = Object.assign({}, cfg.data.requirement);
  }

  RuleOptions = [
    { label: 'Regex', value: 'regex' },
    { label: 'Greater than', value: 'gt' },
    { label: 'Greater than or equal', value: 'gte' },
    { label: 'Less than', value: 'lt' },
    { label: 'Less than or equal', value: 'lte' },
    { label: 'Equal', value: 'eq' },
    { label: 'Not equal', value: 'neq' },
    { label: 'In', value: 'in' },
    { label: 'Not in', value: 'nin' },
    { label: 'Contains', value: 'contains' },
    { label: 'Not contains', value: 'ncontains' }
  ]

  public get regexHelpLink(): string {
    return `https://regex101.com?regex=${encodeURIComponent(this.cfg.data.requirement.constraint || '')}&flavor=python&flags=g`;
  }

  public close(): void {
    this.cfg.data.requirement = this.temp;
    this.ref.close(false);
  }
}

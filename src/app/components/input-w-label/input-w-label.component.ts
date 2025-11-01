import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { Tooltip } from "primeng/tooltip";
import { PasswordModule } from 'primeng/password';

export interface FormItem {
    type?: string;
    label?: string;
    value: any;
    required?: boolean;
    recommended?: boolean;
    disabled?: boolean;
    calculated?: boolean;
}

@Component({
    selector: 'app-input-w-label',
    imports: [CommonModule, FormsModule, InputTextModule, Tooltip, ButtonModule, PasswordModule],
    standalone: true,
    template: `
    <div class="input-w-label__item-label">
      {{ label }}<span *ngIf="required" class="required-indicator">*</span>
    </div>

    <div class="input-w-label__item-input">
      @switch (type) {
        @case('password') {
          <p-password
            [(ngModel)]="value"
            (ngModelChange)="valueChange.emit($event)"
            [feedback]="false"
            size="small"
            fluid
            [disabled]="disabled"
            [placeholder]="label ? label : ''"
            [toggleMask]="true"
          />
        }
        @default {
          <input
            pInputText
            [(ngModel)]="value"
            (ngModelChange)="valueChange.emit($event)"
            (blur)="valueChange.emit(value)"
            [type]="type"
            pSize="small"
            fluid
            [disabled]="disabled"
            [placeholder]="label ? label : ''"
            [style.border]="borderStyle"
          />
        }
      }

      <p-button
        text
        severity="secondary"
        size="small"
        icon="pi pi-sparkles"
        *ngIf="calculated"
        pTooltip="Valeur interprétée"
        tooltipPosition="left">
      </p-button>
    </div>
  `,
    styles: [`
    .input-w-label__item-label { font-size: 0.75rem; }
    .input-w-label__item-input { display: flex; align-items: center; gap: var(--gap-s); }
  `]
})
export class InputWLabelComponent {
    @Input() type: string = 'text';
    @Input() label: string = '';
    @Input() value: any = '';
    @Input() required: boolean = false;
    @Input() recommended: boolean = false;
    @Input() disabled: boolean = false;
    @Input() calculated: boolean = false;

    @Output() valueChange = new EventEmitter<any>();

    private get isEmpty(): boolean {
        return this.value === null || this.value === undefined || this.value === '';
    }

    public get borderStyle(): string {
        if (!this.isEmpty) return '';
        return this.required ? '1px solid var(--p-red-500)' : 
               this.recommended ? '1px solid var(--p-orange-500)' : '';
    }
}

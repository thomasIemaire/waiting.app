import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { Tooltip } from "primeng/tooltip";
import { PasswordModule } from "primeng/password";
import { AutoFocusModule } from 'primeng/autofocus';
import { InputMaskModule } from 'primeng/inputmask';
import { KeyFilterModule, KeyFilterPattern } from 'primeng/keyfilter';

export interface FormItem {
  type?: string;
  label?: string;
  value: any;
  required?: boolean;
  recommended?: boolean;
  disabled?: boolean;
  ok?: boolean;
  calculated?: boolean;
  autofocus?: boolean;
  mask?: RegExp | KeyFilterPattern | null;
}

@Component({
  selector: "app-input-w-label",
  imports: [CommonModule, FormsModule, InputTextModule, Tooltip, ButtonModule, PasswordModule, AutoFocusModule, InputMaskModule, KeyFilterModule],
  standalone: true,
  template: `
    <div class="input-label">
      <div>{{ label }}<span *ngIf="required" class="required-indicator">*</span></div>
    </div>

    <div class="input-w-label__item-input">
      @switch (type) {
        @case('password') {
          <p-password
            [(ngModel)]="value"
            (ngModelChange)="valueChange.emit($event)"
            (onBlur)="onBlur()"
            [feedback]="false"
            size="small"
            fluid
            [disabled]="disabled"
            [placeholder]="label ? label : ''"
            [toggleMask]="true"
            [style.border]="borderStyle"
            [pAutoFocus]="autofocus"
          />
        }
        @default {
          <input
            pInputText
            [(ngModel)]="value"
            (ngModelChange)="valueChange.emit($event)"
            (blur)="onBlur()"
            [type]="type"
            pSize="small"
            fluid
            [disabled]="disabled"
            [placeholder]="label ? label : ''"
            [style.border]="borderStyle"
            [pAutoFocus]="autofocus"
            [pKeyFilter]="mask"
          />
        }
      }

      <p-button
        text
        severity="secondary"
        size="small"
        icon="pi pi-question-circle"
        *ngIf="calculated"
        pTooltip="Valeur interprétée"
        tooltipPosition="left">
      </p-button>
    </div>
  `,
  styles: [`
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
  @Input() ok: boolean = false;
  @Input() calculated: boolean = false;
  @Input() autofocus: boolean = false;
  @Input() mask: RegExp | KeyFilterPattern | null = null;

  @Output() valueChange = new EventEmitter<any>();
  @Output() blur = new EventEmitter<any>();

  private get isEmpty(): boolean {
    return this.value === null || this.value === undefined || this.value === '';
  }

  public get borderStyle(): string {
    if (this.ok) return '1px solid var(--p-green-500)';
    if (!this.isEmpty) return '';
    return this.required ? '1px solid var(--p-red-500)' :
      this.recommended ? '1px solid var(--p-yellow-500)' : '';
  }

  onBlur(): void {
    // si tu veux aussi renvoyer la valeur au blur
    this.valueChange.emit(this.value);
    this.blur.emit(this.value);
  }
}

import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
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
    disabled?: boolean;
    calculated?: boolean;
}

@Component({
    selector: 'app-input-w-label',
    imports: [CommonModule, FormsModule, InputTextModule, Tooltip, ButtonModule, PasswordModule],
    template: `
    <div class="input-w-label__item-label">{{ label }}<span *ngIf="required" class="required-indicator">*</span></div>
    <div class="input-w-label__item-input">
        @switch (type) {
            @case('password') {
                <p-password [(ngModel)]="value" [feedback]="false" size="small" fluid [disabled]="disabled" [placeholder]="label ? label : ''" [toggleMask]="true" />
            }
            @default {
                <input pInputText [(ngModel)]="value" [type]="type" pSize="small" fluid [disabled]="disabled" [placeholder]="label ? label : ''" />
            }
        }
        <p-button text severity="secondary" size="small" icon="pi pi-sparkles" *ngIf="calculated" pTooltip="Valeur interprétée" tooltipPosition="left"></p-button>
    </div>
    `,
    styles: `
    .input-w-label__item-label {
        font-size: 0.75rem;
    }

    .input-w-label__item-input {
        display: flex;
        align-items: center;
        gap: var(--gap-s);
    }
    `
})
export class InputWLabelComponent {
    @Input()
    public type?: string = 'text';

    @Input()
    public label: string = '';

    @Input()
    public value: any = '';

    @Input()
    public required: boolean = false;

    @Input()
    public disabled: boolean = false;

    @Input()
    public calculated: boolean = false;
}

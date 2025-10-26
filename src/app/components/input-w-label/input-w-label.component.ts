import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { Tooltip } from "primeng/tooltip";

export interface FormItem {
    label?: string;
    value: any;
    required?: boolean;
    disabled?: boolean;
    calculated?: boolean;
}

@Component({
    selector: 'app-input-w-label',
    imports: [CommonModule, FormsModule, InputTextModule, Tooltip, ButtonModule],
    template: `
    <div class="input-w-label__item-label">{{ label }}<span *ngIf="required" class="required-indicator">*</span></div>
    <div class="input-w-label__item-input">
        <input pInputText [(ngModel)]="value" type="text" pSize="small" fluid [disabled]="disabled"/>
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

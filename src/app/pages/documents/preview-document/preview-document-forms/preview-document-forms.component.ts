import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from 'primeng/inputtext';

export interface Form {
    label: string;
    items: FormItem[];
}

export interface FormItem {
    label: string;
    value: any;
    required?: boolean;
    disabled?: boolean;
}

@Component({
    selector: 'app-preview-document-forms',
    imports: [CommonModule, FormsModule, InputTextModule],
    template: `
    <div class="preview-document-forms__wrapper">
        <div class="preview-document-forms__label">{{ form.label }}</div>
        <div class="preview-document-forms__group-items">
            <div *ngFor="let item of form.items" class="preview-document-forms__item">
                <div class="preview-document-forms__item-label">{{ item.label }}<span *ngIf="item.required" class="required-indicator">*</span></div>
                <input pInputText [(ngModel)]="item.value" type="text" pSize="small" fluid [disabled]="item.disabled || false" />
            </div>
        </div>
    </div>
    `,
    styleUrls: ['./preview-document-forms.component.scss']
})
export class PreviewDocumentFormsComponent {
    @Input({ required: true }) form!: Form;
}
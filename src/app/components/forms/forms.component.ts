import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormItem, InputWLabelComponent } from "../input-w-label/input-w-label.component";

export interface Form {
    label?: string;
    items: FormItem[];
}

@Component({
    selector: 'app-forms',
    imports: [CommonModule, FormsModule, InputWLabelComponent],
    template: `
    <div class="forms__wrapper">
        <div class="forms__label" *ngIf="form.label">{{ form.label }}</div>
        <div class="forms__group-items">
            <div *ngFor="let item of form.items" class="forms__item">
                <app-input-w-label [label]="item.label ?? ''" [value]="item.value" [required]="item.required || false" [disabled]="item.disabled || false" [calculated]="item.calculated || false"/>
            </div>
        </div>
    </div>
    `,
    styleUrls: ['./forms.component.scss']
})
export class FormsComponent {
    @Input({ required: true }) form!: Form;
}
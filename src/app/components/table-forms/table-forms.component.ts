import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from 'primeng/inputtext';
import { Column } from "../table/table.component";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from 'primeng/tooltip';

export interface TableForm {
    label: string;
    cols: Column[];
    rows: TableFormRow[];
}

export interface TableFormRow {
    items: { [key: string]: TableFormItem; };
}

export interface TableFormItem {
    value: string | number;
    disabled?: boolean;
}

@Component({
    selector: 'app-table-forms',
    imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, TooltipModule],
    template: `
    <div class="table-forms__wrapper">
        <div class="table-forms__label">{{ form.label }}</div>
        <div class="table-forms__group-items">
            <table class="table-forms__table">
                <thead>
                    <tr>
                        <td class="table-header__label" *ngFor="let col of cols">{{ col.header }}</td>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let row of form.rows; let i = index">
                        <p-button variant="text" severity="secondary" size="small" [label]="(i + 1).toString()" />
                        <td *ngFor="let col of form.cols">
                            <input pInputText [(ngModel)]="row.items[col.field].value" type="text" pSize="small" fluid [disabled]="row.items[col.field].disabled || false" />
                        </td>
                        <p-button variant="text" severity="danger" size="small" icon="pi pi-minus" (onClick)="removeLine(row)" pTooltip="Supprimer la ligne" tooltipPosition="left" />
                    </tr>
                </tbody>
            </table>
            <p-button variant="text" severity="secondary" size="small" label="Ajouter une ligne" icon="pi pi-plus" (onClick)="addLine()" />
        </div>
    </div>
    `,
    styleUrls: ['./table-forms.component.scss']
})
export class TableFormsComponent {
    @Input({ required: true }) form!: TableForm;

    public cols: Column[] = [];

    ngOnInit() {
        this.cols = [
            { field: 'index', header: '' },
            ...this.form.cols
        ];
    }

    public addLine(): void {
        const newRow: TableFormRow = {
            items: {}
        };
        this.form.rows.push(newRow);
        this.form.cols.forEach(col => {
            newRow.items[col.field] = { value: '' };
        });
    }

    public removeLine(rowToRemove: TableFormRow): void {
        this.form.rows = this.form.rows.filter(row => row !== rowToRemove);
    }
}
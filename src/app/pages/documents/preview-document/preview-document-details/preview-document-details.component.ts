import { Component, Input } from "@angular/core";
import { Form, FormsComponent } from "../../../../components/forms/forms.component";
import { TableFormsComponent, TableForm } from "../../../../components/table-forms/table-forms.component";

@Component({
    selector: 'app-preview-document-details',
    imports: [TableFormsComponent, FormsComponent],
    template: `
    <div class="preview-document-details__wrapper">
        <app-table-forms [form]="lineForm" class="extended" />
        <app-forms [form]="vatForm" />
        <app-forms [form]="amountsForm" />
    </div>
    `,
    styleUrls: ['./preview-document-details.component.scss']
})
export class PreviewDocumentDetailsComponent {
    @Input() data?: any;

    public lineForm!: TableForm;
    public vatForm!: Form;
    public amountsForm!: Form;

    ngOnInit() {
        this.initForms();
    }

    ngOnChanges() {
        this.initForms();
    }

    private initForms(): void {
        this.lineForm = this.getLineForm();
        this.vatForm = this.getVatForm();
        this.amountsForm = this.getAmountsForm();
    }

    private getLineForm(): TableForm {
        const lines = this.data?.analysis?.line || [];
        const mappedRows = this.mapAnalysisLinesToRows(lines);

        return {
            label: 'Ligne(s) de la facture',
            cols: [
                { field: 'reference', header: 'Référence' },
                { field: 'label', header: 'Désignation' },
                { field: 'quantity', header: 'Quantité' },
                { field: 'unitPrice', header: 'Prix unitaire' },
                { field: 'totalExclTax', header: 'Total HT' },
                { field: 'taxRate', header: 'Taux de TVA' },
            ],
            rows: mappedRows
        };
    }

    private getVatForm(): Form {
        const analysis = this.data?.analysis;
        return {
            label: 'TVA de la facture',
            items: [
                { label: 'Base', value: analysis?.amount?.ht ?? '' },
                { label: 'Taux', value: '' },
                { label: 'Montant', value: analysis?.amount?.tva ?? '' },
            ]
        };
    }

    private getAmountsForm(): Form {
        const analysis = this.data?.analysis;
        return {
            label: 'Montants de la facture',
            items: [
                { label: 'HT', value: analysis?.amount?.ht ?? '', advised: true },
                { label: 'TVA', value: analysis?.amount?.tva ?? '', advised: true },
                { label: 'TTC', value: analysis?.amount?.ttc ?? '', advised: true }
            ]
        };
    }

    private mapAnalysisLinesToRows(lineCols: any): any[] {
        const labels: any[] = lineCols?.label ?? [];
        const qtys: any[] = lineCols?.quantity ?? [];
        const units: any[] = lineCols?.unitprice ?? [];
        const totals: any[] = lineCols?.totalprice ?? [];
        const tvas: any[] = lineCols?.tva ?? [];
        const refs: any[] = lineCols?.reference ?? [];

        const n = Math.max(labels.length, qtys.length, units.length, totals.length, tvas.length, refs.length);

        const rows: any[] = [];

        for (let i = 0; i < n; i++) {
            const refRaw = refs[i] ?? "";
            const labelRaw = labels[i] ?? "";
            const qtyRaw = qtys[i] ?? "";
            const unitRaw = units[i] ?? "";
            const totRaw = totals[i] ?? "";
            const tvaRaw = tvas[i] ?? "";

            // parse numériques
            const qty = qtyRaw;
            let unit = unitRaw;
            let ht = totRaw;
            const tvaTx = tvaRaw;

            // ignorer les lignes totalement vides
            const isEmpty =
                (!refRaw || refRaw === "") &&
                (!labelRaw || labelRaw === "") &&
                (qty === null || qty === 0) &&
                (unit === null || unit === 0) &&
                (ht === null || ht === 0) &&
                (tvaTx === null || tvaTx === 0);
            if (isEmpty) continue;

            // calculs manquants
            let unitCalculated = false;
            let htCalculated = false;

            if ((ht === null || ht === 0) && qty !== null && qty > 0 && unit !== null) {
                ht = qty * unit;
                htCalculated = true;
            }

            if ((unit === null || unit === 0) && qty !== null && qty > 0 && ht !== null) {
                unit = ht / qty;
                unitCalculated = true;
            }

            rows.push({
                items: {
                    reference: { value: String(refRaw || "").trim() },
                    label: { value: String(labelRaw || "").trim() },
                    quantity: { value: qty ?? "" },
                    unitPrice: { value: unit, calculated: unitCalculated || undefined },
                    totalExclTax: { value: ht, calculated: htCalculated || undefined },
                    taxRate: { value: tvaTx },
                }
            });
        }

        return rows;
    }
}

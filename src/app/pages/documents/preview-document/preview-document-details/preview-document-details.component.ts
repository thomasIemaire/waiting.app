import { Component } from "@angular/core";
import { Form, PreviewDocumentFormsComponent } from "../preview-document-forms/preview-document-forms.component";
import { PreviewDocumentTableFormsComponent, TableForm } from "../preview-document-table-forms/preview-document-table-forms.component";

@Component({
    selector: 'app-preview-document-details',
    imports: [PreviewDocumentTableFormsComponent, PreviewDocumentFormsComponent],
    template: `
    <div class="preview-document-details__wrapper">
        <app-preview-document-table-forms [form]="lineForm" class="extended" />
        <app-preview-document-forms [form]="supplierForm" />
        <app-preview-document-forms [form]="customerForm" />
    </div>
    `,
    styleUrls: ['./preview-document-details.component.scss']
})
export class PreviewDocumentDetailsComponent {
    public lineForm: TableForm = {
        label: 'Ligne(s) de la facture',
        cols: [
            { field: 'reference', header: 'Référence' },
            { field: 'label', header: 'Désignation' },
            { field: 'quantity', header: 'Quantité' },
            { field: 'unitPrice', header: 'Prix unitaire' },
            { field: 'totalExclTax', header: 'Total HT' },
            { field: 'taxRate', header: 'Taux de TVA' },
        ],
        rows: [
            {
                items: {
                    reference: { value: 'REF001' },
                    label: { value: 'Produit A' },
                    quantity: { value: 2 },
                    unitPrice: { value: '100 €' },
                    totalExclTax: { value: '200 €' },
                    taxRate: { value: '20%' },
                }
            },
            {
                items: {
                    reference: { value: 'REF002' },
                    label: { value: 'Produit B' },
                    quantity: { value: 1 },
                    unitPrice: { value: '150 €' },
                    totalExclTax: { value: '150 €' },
                    taxRate: { value: '20%' },
                    flux: { value: 'Entrant' }
                }
            }
        ]
    };

    public supplierForm: Form = {
        label: 'TVA de la facture',
        items: [
            { label: 'Base', value: '1000 €' },
            { label: 'Taux', value: '20%' },
            { label: 'Montant', value: '200 €' },
        ]
    };

    public customerForm: Form = {
        label: 'Montants de la facture',
        items: [
            { label: 'HT', value: '1000 €' },
            { label: 'TVA', value: '200 €' },
            { label: 'TTC', value: '1200 €' },
            { label: 'Reste à payer', value: '1200 €' },
        ]
    };
}

import { Component } from "@angular/core";
import { Form, FormsComponent } from "../../../../components/forms/forms.component";

@Component({
    selector: 'app-preview-document-globals',
    imports: [FormsComponent],
    template: `
    <div class="preview-document-globals__wrapper">
        <app-forms [form]="documentForm" />
        <div></div>
        <app-forms [form]="supplierForm" />
        <app-forms [form]="customerForm" />
    </div>
    `,
    styleUrls: ['./preview-document-globals.component.scss']
})
export class PreviewDocumentGlobalsComponent {
    public documentForm: Form = {
        label: 'Informations du document',
        items: [
            { label: 'Nom', value: 'DOC-001' },
            { label: 'Type', value: 'Facture', disabled: true },
            { label: 'Flux', value: 'Sortant', disabled: true },
            { label: 'Référence du document', value: 'EXT-12345' },
            { label: 'Date d\'émission', value: '2024-01-15' },
            { label: 'Date d\'échéance', value: '2024-02-15' },
            { label: 'Statut', value: 'En attente', disabled: true },
        ]
    };

    public supplierForm: Form = {
        label: 'Informations du fournisseur',
        items: [
            { label: 'Nom', value: 'Fournisseur 1', required: true },
            { label: 'Rue', value: '10 Rue de la Paix' },
            { label: 'Ville', value: 'Paris' },
            { label: 'Code Postal', value: '75001' },
            { label: 'Pays', value: 'France' },
            { label: 'TVA Intracommunautaire', value: 'FR123456789', required: true },
            { label: 'SIREN', value: '123 456 789', required: true, calculated: true },
        ]
    };

    public customerForm: Form = {
        label: 'Informations du client',
        items: [
            { label: 'Nom', value: 'Client 1', required: true },
            { label: 'Rue', value: '20 Avenue des Champs' },
            { label: 'Ville', value: 'Lyon' },
            { label: 'Code Postal', value: '69001' },
            { label: 'Pays', value: 'France' },
            { label: 'TVA Intracommunautaire', value: 'FR987654321' },
            { label: 'SIREN', value: '987 654 321', calculated: true },
        ]
    };
}
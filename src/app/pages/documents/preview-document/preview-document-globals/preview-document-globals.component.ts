import { Component, Input } from "@angular/core";
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
    @Input() data?: any;

    public documentForm!: Form;
    public supplierForm!: Form;
    public customerForm!: Form;

    ngOnInit() {
        this.initForms();
    }

    ngOnChanges() {
        this.documentForm = this.getDocumentForm();
        this.supplierForm = this.getSupplierForm();
        this.customerForm = this.getCustomerForm();
    }

    private initForms(): void {
        this.documentForm = this.getDocumentForm();
        this.supplierForm = this.getSupplierForm();
        this.customerForm = this.getCustomerForm();
    }

    private getDocumentForm(): Form {
        return {
            label: 'Informations du document',
            items: [
                { label: 'Nom', value: this.data?.filename ?? '' },
                { label: 'Type', value: this.data?.type ?? '', disabled: true }
            ]
        };
    }

    private getSupplierForm(): Form {
        const analysis = this.data?.analysis;
        const address = analysis?.from?.address;
        return {
            label: 'Informations du fournisseur',
            items: [
                { label: 'Nom', value: address?.name ?? '', required: true },
                { label: 'Rue', value: address?.street ?? '' },
                { label: 'Ville', value: address?.city ?? '' },
                { label: 'Code Postal', value: address?.zip ?? '' },
                { label: 'Pays', value: address?.country ?? '' },
                { label: 'TVA Intracommunautaire', value: analysis?.vat?.number ?? '', required: true },
                { label: 'SIREN', value: analysis?.siren ?? '', required: true, calculated: true },
            ]
        };
    }

    private getCustomerForm(): Form {
        const analysis = this.data?.analysis;
        const address = analysis?.to?.address;
        return {
            label: 'Informations du client',
            items: [
                { label: 'Nom', value: address?.name ?? '', required: true },
                { label: 'Rue', value: address?.street ?? '' },
                { label: 'Ville', value: address?.city ?? '' },
                { label: 'Code Postal', value: address?.zip ?? '' },
                { label: 'Pays', value: address?.country ?? '' }
            ]
        };
    }
}
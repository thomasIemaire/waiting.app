import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Form, FormsComponent } from "../../../../components/forms/forms.component";
import { DeviceService } from "../../../../core/services/device.service";

@Component({
    selector: 'app-preview-document-globals',
    imports: [FormsComponent],
    template: `
    <div class="preview-document-globals__wrapper" [class.mobile]="!deviceService.isDesktopSize">
        <app-forms [(form)]="documentForm" />
        <div></div>
        <app-forms [(form)]="supplierForm" />
        <app-forms [(form)]="customerForm" />
    </div>
    `,
    styleUrls: ['./preview-document-globals.component.scss']
})
export class PreviewDocumentGlobalsComponent {
    @Input() data?: any;

    @Output() dataChange = new EventEmitter<any>();

    public documentForm!: Form;
    public supplierForm!: Form;
    public customerForm!: Form;

    public deviceService: DeviceService = inject(DeviceService);

    ngOnInit() {
        this.initForms();
    }

    ngOnChanges() {
        this.documentForm = this.getDocumentForm();
        this.supplierForm = this.getSupplierForm();
        this.customerForm = this.getCustomerForm();
    }

    onDocumentFormChange(f: Form) {
        this.documentForm = f;
        if (!this.data) return;

        const name = f.items.find(i => i.label === 'Nom')?.value ?? '';
        this.data.filename = name;

        this.emitChange();
    }

    private emitChange() {
        this.dataChange.emit({ ...this.data });
    }

    private initForms(): void {
        this.documentForm = this.getDocumentForm();
        this.supplierForm = this.getSupplierForm();
        this.customerForm = this.getCustomerForm();
    }

    private getDocumentForm(): Form {
        const analysis = this.data?.analysis;
        return {
            label: 'Informations du document',
            items: [
                { label: 'Nom', value: this.data?.filename ?? '' },
                { label: 'Type', value: this.data?.type ?? '', disabled: true },
                { label: 'Date', value: analysis?.date ?? '', disabled: true },
                { label: 'Numéro', value: analysis?.order?.number ?? '', disabled: true },
            ]
        };
    }

    private getSupplierForm(): Form {
        const analysis = this.data?.analysis;
        const seller = analysis?.seller;
        const address = seller?.address;
        return {
            label: 'Informations du fournisseur',
            items: [
                { label: 'Nom', value: address?.name ?? '', required: true },
                { label: 'Rue', value: address?.street ?? '' },
                { label: 'Ville', value: address?.city ?? '' },
                { label: 'Code Postal', value: address?.zip_code ?? '' },
                { label: 'Pays', value: address?.country ?? '' },
                { label: 'TVA Intracommunautaire', value: seller?.vat?.number ?? '', required: true },
                { label: 'SIREN', value: analysis?.seller?.siren ?? '', required: true, calculated: true },
            ]
        };
    }

    private getCustomerForm(): Form {
        const analysis = this.data?.analysis;
        const customer = analysis?.customer;
        const address = customer?.address;
        return {
            label: 'Informations du client',
            items: [
                { label: 'Numéro client', value: customer?.number ?? '' },
                { label: 'Nom', value: address?.name ?? analysis?.address?.name ?? '', required: true },
                { label: 'Rue', value: address?.street ?? analysis?.address?.street ?? '' },
                { label: 'Ville', value: address?.city ?? analysis?.address?.city ?? '' },
                { label: 'Code Postal', value: address?.zip_code ?? analysis?.address?.zip_code ?? '' },
                { label: 'Pays', value: address?.country ?? analysis?.address?.country ?? '' },
                { label: 'TVA Intracommunautaire', value: customer?.vat?.number ?? '', required: true },
                { label: 'SIREN', value: analysis?.customer?.siren ?? '', required: true, calculated: true },
            ]
        };
    }
}
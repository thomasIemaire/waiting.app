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
        const analysis = this.data?.analysis?.extracted;
        return {
            label: 'Informations du document',
            items: [
                { label: 'Nom', value: this.data?.filename ?? '' },
                { label: 'Type', value: this.data?.type ?? '', disabled: true },
                { label: 'Référence', value: analysis?.document[0]?.number ?? '', disabled: true },
            ]
        };
    }

    private getSupplierForm(): Form {
        const analysis = this.data?.analysis?.extracted;
        const seller = analysis?.seller;
        const address = seller?.address;
        console.log(analysis);
        
        return {
            label: 'Informations de l\'émetteur',
            items: [
                { label: 'Nom', value: analysis?.seller[0]?.name ?? '' },
                ...this.getAddressForm(analysis.address_seller[0]).items,
                ...this.getRegulatoryForm(analysis?.seller[0]).items,
            ]
        };
    }

    private getCustomerForm(): Form {
        const analysis = this.data?.analysis?.extracted;
        const customer = analysis?.customer;
        const address = customer?.address;
        return {
            label: 'Informations du destinataire',
            items: [
                { label: 'Référence', value: analysis?.customer[0]?.number ?? '' },
                { label: 'Nom', value: analysis?.buyer[0]?.name ?? '' },
                ...this.getAddressForm(analysis.address_buyer[0]).items,
                ...this.getRegulatoryForm(analysis?.buyer[0]).items
            ]
        };
    }

    private getAddressForm(address: any): Form {
        return {
            items: [
                { label: 'Rue', value: address?.street ?? '' },
                { label: 'Ville', value: address?.city ?? '' },
                { label: 'Code Postal', value: address?.zip_code ?? '' },
                { label: 'Pays', value: address?.country ?? '' },
            ]
        }
    }

    private getRegulatoryForm(company: any): Form {
        return {
            items: [
                { label: 'SIREN', value: company?.siren ?? '', required: true },
                { label: 'TVA Intracommunautaire', value: company?.tax_id ?? '', required: true },
            ]
        }
    }

    private getContactForm(contact: any): Form {
        return {
            items: [
                { label: 'Nom', value: contact?.name ?? '' },
                { label: 'Email', value: contact?.email ?? '' },
                { label: 'Téléphone', value: contact?.phone ?? '' },
            ]
        }
    }
}
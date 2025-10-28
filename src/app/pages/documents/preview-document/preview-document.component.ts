import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { Router, ActivatedRoute } from "@angular/router";
import { PreviewDocumentGlobalsComponent } from "./preview-document-globals/preview-document-globals.component";
import { PreviewDocumentDetailsComponent } from "./preview-document-details/preview-document-details.component";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { SaveFooterComponent } from "../../../components/save-footer/save-footer.component";
import { FormsComponent } from "../../../components/forms/forms.component";
import { DocumentsService } from "../../../core/services/documents.service";

@Component({
    selector: 'app-preview-document',
    imports: [CommonModule, FormsModule, SelectButtonModule, ButtonModule, PreviewDocumentGlobalsComponent, PreviewDocumentDetailsComponent, ToastModule],
    template: `
    <p-toast />
    <div class="preview-document__wrapper">
        <div class="preview-document__header">
            <p-button variant="text" severity="secondary" size="small" label="Retour" icon="pi pi-arrow-left" (onClick)="backDocuments()" />
            <p-button variant="text" severity="warn" size="small" label="Cette facture contient un nouveau client, cliquer pour en savoir plus." icon="pi pi-exclamation-triangle" (onClick)="addCustomer()"/>
        </div>
        <div class="preview-document__content">
            <div class="preview-document__image">
                <img *ngIf="previewSrc" [src]="previewSrc" alt="Document Preview" draggable="false" />
            </div>
            <div class="preview-document__informations">
                <div class="preview-document__informations-content">
                    <p-selectbutton [options]="previewOpts" [(ngModel)]="selectOpt" [allowEmpty]="false" optionLabel="label" optionValue="value" size="small" fluid />
                    @switch (selectOpt) {
                    @case ('globals') {
                    <app-preview-document-globals />
                    }
                    @case ('details') {
                    <app-preview-document-details />
                    }
                    }
                </div>
                <div class="preview-document__informations-footer">
                    <p-button variant="text" severity="secondary" size="small" label="Annuler" />
                    <p-button variant="text" severity="primary" size="small" label="Exporter" />
                    <p-button severity="primary" size="small" label="Enregistrer" (click)="sendResult()"/>
                </div>
            </div>
        </div>
    </div>
    `,
    styleUrls: ['./preview-document.component.scss'],
    providers: [MessageService, DialogService]
})
export class PreviewDocumentComponent {
    private messageService: MessageService = inject(MessageService);
    private router: Router = inject(Router);
    private route: ActivatedRoute = inject(ActivatedRoute);
    private dialogService: DialogService = inject(DialogService);
    private documentsService: DocumentsService = inject(DocumentsService);

    public base64: string | null = null;
    public previewSrc: string | null = null;

    public ref?: DynamicDialogRef | null;

    public previewOpts = [
        { label: 'Informations générales', value: 'globals' },
        { label: 'Détails de la facture', value: 'details' },
    ];

    public selectOpt = 'globals';

    public backDocuments(): void {
        this.router.navigate(['/documents']);
    }

    public addCustomer(): void {
        this.ref = this.dialogService.open(FormsComponent, {
            inputValues: {
                form: {
                    items: [
                        { label: 'Nom', value: 'Client 1', required: true },
                        { label: 'Rue', value: '20 Avenue des Champs' },
                        { label: 'Ville', value: 'Lyon' },
                        { label: 'Code Postal', value: '69001' },
                        { label: 'Pays', value: 'France' },
                        { label: 'TVA Intracommunautaire', value: 'FR987654321' },
                        { label: 'SIREN', value: '987 654 321' },
                    ]
                }
            },
            header: 'Nouveau client',
            width: '512px',
            modal: true,
            contentStyle: { overflow: 'auto' },
            templates: {
                footer: SaveFooterComponent
            }
        });
    }

    async ngOnInit(): Promise<void> {
        this.route.paramMap.subscribe(async params => {
            const documentId = params.get('id');
            if (!documentId)
                return;

            const response = await this.documentsService.getDocumentById(documentId);
            this.base64 = response.data;

            if (this.base64) {
                this.previewSrc = await this.base64ToFirstPageImage(this.base64);
            }
        });
    }

    public sendResult(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Document enregistré',
            detail: 'Le document sera transmis à notre PDP.',
        });
    }

    private async base64ToFirstPageImage(base64: string): Promise<string> {
        const splitDataUrl = (s: string) => {
            const i = s.indexOf(',');
            return i >= 0 ? s.slice(i + 1) : s;
        };
        const isPdfBase64 = (b64: string) => b64.startsWith('JVBERi0');
        const toDataUrl = (mime: string, b64: string) =>
            base64.startsWith('data:') ? base64 : `data:${mime};base64,${b64}`;

        const pure = splitDataUrl(base64);

        if (!isPdfBase64(pure)) {
            const mime = base64.startsWith('data:') ? base64.slice(5, base64.indexOf(';')) : 'image/*';
            return toDataUrl(mime, pure);
        }

        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        (pdfjs as any).GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';

        const raw = atob(pure);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

        const loadingTask = (pdfjs as any).getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        return canvas.toDataURL('image/png');
    }
}
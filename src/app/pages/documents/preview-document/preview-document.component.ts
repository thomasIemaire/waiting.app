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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DeviceService } from "../../../core/services/device.service";

@Component({
    selector: 'app-preview-document',
    imports: [CommonModule, FormsModule, SelectButtonModule, ButtonModule, PreviewDocumentGlobalsComponent, PreviewDocumentDetailsComponent, ToastModule, ProgressSpinnerModule],
    template: `
    <p-toast />
    <div class="preview-document__wrapper">
        <div class="preview-document__header">
            <p-button variant="text" severity="secondary" size="small" label="Retour" icon="pi pi-arrow-left" (onClick)="backDocuments()" />
            <p-button variant="text" severity="warn" size="small" icon="pi pi-exclamation-triangle" (onClick)="addCustomer()"
                [label]="deviceService.isMobileSize ? 'Nouveau client détecté.' : 'Cette facture contient un nouveau client, cliquer pour en savoir plus.'" />
        </div>
        <div class="preview-document__content">
            <div *ngIf="!deviceService.isMobileSize" class="preview-document__image" [class.loading]="!previewSrc">
                <img *ngIf="previewSrc" [src]="previewSrc" alt="Document Preview" draggable="false" />
                 <div class="preview-document__image-loading" *ngIf="!previewSrc">
                     <p-progress-spinner />
                 </div>
            </div>
            <div class="preview-document__informations">
                <div class="preview-document__informations-content">
                    <p-selectbutton [options]="previewOpts" [(ngModel)]="selectOpt" [allowEmpty]="false" optionLabel="label" optionValue="value" size="small" fluid />
                    @switch (selectOpt) {
                    @case ('preview') {
                    <div class="preview-document__image" [class.loading]="!previewSrc" [style.maxWidth.%]="100">
                        <img *ngIf="previewSrc" [src]="previewSrc" alt="Document Preview" draggable="false" />
                        <div class="preview-document__image-loading" *ngIf="!previewSrc">
                            <p-progress-spinner />
                        </div>
                    </div>
                    }
                    @case ('globals') {
                    <app-preview-document-globals [(data)]="data" *ngIf="data" />
                    }
                    @case ('details') {
                    <app-preview-document-details [(data)]="data" *ngIf="data" />
                    }
                    }
                    <div class="preview-document__no-data" *ngIf="!data">
                        <p-progress-spinner />
                    </div>
                </div>
                <div class="preview-document__informations-footer">
                    <p-button variant="text" severity="secondary" size="small" label="Annuler" (click)="backDocuments()" />
                    <p-button variant="text" severity="primary" size="small" label="Exporter" (click)="downloadResult()" />
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
    public deviceService: DeviceService = inject(DeviceService);

    public base64: string | null = null;
    public previewSrc: string | null = null;
    public data: any = null;

    public ref?: DynamicDialogRef | null;

    private DEFAULT_PREVIEW_OPTS = [
        { label: this.deviceService.isMobileSize ? 'Générales' : 'Informations générales', value: 'globals' },
    ];

    public previewOpts = this.DEFAULT_PREVIEW_OPTS;

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

            this.previewOpts = this.DEFAULT_PREVIEW_OPTS;
            if (this.deviceService.isMobileSize) {
                this.selectOpt = 'preview';
                this.previewOpts = [{ label: 'Aperçu', value: 'preview' }, ...this.previewOpts];
            }

            const response = await this.documentsService.getDocumentById(documentId);
            this.base64 = response.data;

            if (this.base64) {
                this.previewSrc = await this.base64ToFirstPageImage(this.base64);
            }
        });

        this.route.paramMap.subscribe(async params => {
            const documentId = params.get('id');
            if (!documentId)
                return;

            this.data = null;

            const response = await this.documentsService.processDocument(documentId);
            this.data = response;

            switch (this.data.type) {
                case 'facture':
                    this.previewOpts = [...this.previewOpts, { label: this.deviceService.isMobileSize ? 'Détails' : 'Détails de la facture', value: 'details' }];
                    break;
                case 'bullet-de-paie':
                    this.previewOpts = [...this.previewOpts, { label: this.deviceService.isMobileSize ? 'Détails' : 'Détails du bulletin de paie', value: 'details' }];
                    break;
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

    public downloadResult(): void {
        if (!this.data || !this.data?.analysis) return;
        try {
            const json = JSON.stringify(this.data.analysis, null, 2);

            const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

            const rawName = this.data?.filename.split('.')[0] ?? 'result';
            const safeName = (rawName?.trim() || 'result')
                .replace(/[\\/:*?"<>|]/g, '_');
            const filename = safeName.toLowerCase().endsWith('.json')
                ? safeName
                : `${safeName}.json`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.messageService.add({
                severity: 'info',
                summary: 'Téléchargement en cours',
                detail: `Le document "${filename}" est en cours de téléchargement.`,
            });
        } catch (e) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur de téléchargement',
                detail: 'Impossible de générer le fichier JSON.',
            });
        }
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
import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { TruncateTextPipe } from '../../core/pipes/truncate-text.pipe';
import { MessageService } from 'primeng/api';
import { DocumentsService } from '../../core/services/documents.service';
import { Button } from 'primeng/button';

export interface Base64File {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    base64: string;
    dataUrl: string;
}

@Component({
    selector: 'app-dnd-file',
    imports: [ProgressBar, TruncateTextPipe, Button],
    templateUrl: './dnd-file.component.html',
    styleUrls: ['./dnd-file.component.scss']
})
export class DndFileComponent {
    /** Mode d'affichage : dragdrop (par défaut) ou mobile */
    @Input() mode: 'dragdrop' | 'mobile' = 'dragdrop';

    /** Caméra utilisée pour la capture (mobile) */
    @Input() cameraFacing: 'user' | 'environment' = 'environment';

    @Input() multiple = false;
    @Input() label = 'fichier';
    @Input() acceptedFileTypes: string[] = [];
    @Input() autoUpload = false;

    @Output() fileBase64 = new EventEmitter<Base64File>();
    @Output() filesBase64 = new EventEmitter<Base64File[]>();
    @Output() filesUploaded = new EventEmitter<string[]>();
    @Output() change = new EventEmitter<Base64File | Base64File[]>();
    @Output() rejected = new EventEmitter<File[]>();

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;

    private messageService: MessageService = inject(MessageService);
    private documentsService: DocumentsService = inject(DocumentsService);

    isDragOver = false;
    isUploading = false;
    fileUploading: Base64File | null = null;

    get labelPlural(): string {
        return this.multiple
            ? `Glisser-déposer mes ${this.label}s ici ou cliquer pour les importer`
            : `Glisser-déposer votre ${this.label} ici ou cliquer pour l'importer`;
    }

    /** Accept pour le bouton "Parcourir" (respecte vos filtres) */
    get acceptAttr(): string {
        return (this.acceptedFileTypes ?? []).join(', ');
    }

    /** Ouvre l’explorateur de fichiers */
    openFileDialog(): void {
        this.fileInput?.nativeElement.click();
    }

    /** Ouvre la caméra (mobile) via l’input capture */
    openCamera(): void {
        this.cameraInput?.nativeElement.click();
    }

    onKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.openFileDialog();
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (files && files.length) {
            this.processFiles(files);
            input.value = '';
        }
    }

    /** Capture de photo -> File -> base64 */
    onCameraCapture(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (files && files.length) {
            this.processFiles(files);
            input.value = '';
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
        const files = event.dataTransfer?.files;
        if (files && files.length) this.processFiles(files);
    }

    private async processFiles(fileList: FileList | File[]): Promise<void> {
        const all = Array.from(fileList);
        const { accepted, refused } = this.splitAccepted(all);

        if (refused.length) this.rejected.emit(refused);

        const results = await Promise.all(accepted.map((f) => this.fileToBase64(f)));

        if (this.autoUpload && results.length) {
            const ids = await this.uploadFiles(results);
            this.filesUploaded.emit(ids);
        }

        if (this.multiple) {
            this.filesBase64.emit(results);
            this.change.emit(results);
        } else if (results[0]) {
            this.fileBase64.emit(results[0]);
            this.change.emit(results[0]);
        }
    }

    private async uploadFiles(files: Base64File[]): Promise<string[]> {
        this.isUploading = true;
        const ids: string[] = [];

        try {
            for (const file of files) {
                // Upload séquentiel pour garder l’état d’avancement simple
                // (peut être parallélisé si besoin)
                // eslint-disable-next-line no-await-in-loop
                await this.documentsService.uploadDocument(file).then((data) => {
                    ids.push(data._id);
                });
                this.fileUploading = file;
            }
        } finally {
            this.fileUploading = null;
            this.isUploading = false;
            return ids;
        }
    }

    private fileToBase64(file: File): Promise<Base64File> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error);
            reader.onload = () => {
                const dataUrl = String(reader.result);
                const base64 = dataUrl.split(',')[1] ?? '';
                resolve({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    base64,
                    dataUrl
                });
            };
            reader.readAsDataURL(file);
        });
    }

    private splitAccepted(files: File[]): { accepted: File[]; refused: File[] } {
        if (!this.acceptedFileTypes?.length) return { accepted: files, refused: [] };

        const accepted: File[] = [];
        const refused: File[] = [];

        for (const f of files) {
            const ok = this.acceptedFileTypes.some((pattern) => this.matchAccept(f, pattern));
            (ok ? accepted : refused).push(f);
        }

        this.messageService.add({
            severity: refused.length ? 'warn' : 'info',
            summary: refused.length ? 'Certains fichiers ont été refusés' : 'Fichiers acceptés',
            detail: refused.length ? refused.map(f => f.name).join(', ') : accepted.map(f => f.name).join(', '),
            life: 3000
        });

        return { accepted, refused };
    }

    private matchAccept(file: File, pattern: string): boolean {
        const p = pattern.trim().toLowerCase();
        if (!p) return true;

        if (p.endsWith('/*')) {
            const prefix = p.slice(0, -1);
            return file.type.toLowerCase().startsWith(prefix);
        }

        if (p.startsWith('.')) {
            return file.name.toLowerCase().endsWith(p);
        }

        return file.type.toLowerCase() === p;
    }
}

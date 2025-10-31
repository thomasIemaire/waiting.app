import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { Utils } from '../../core/utils/utils';
import { TruncateTextPipe } from '../../core/pipes/truncate-text.pipe';
import { MessageService } from 'primeng/api';
import { DocumentsService } from '../../core/services/documents.service';
import { DeviceService } from '../../core/services/device.service';

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
    imports: [ProgressBar, TruncateTextPipe],
    templateUrl: './dnd-file.component.html',
    styleUrls: ['./dnd-file.component.scss']
})
export class DndFileComponent {
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

    private messageService: MessageService = inject(MessageService);
    private documentsService: DocumentsService = inject(DocumentsService);
    private deviceService: DeviceService = inject(DeviceService);

    isDragOver = false;

    isUploading = false;
    fileUploading: Base64File | null = null;

    get labelPlural(): string {
        let labelUnique = `Glisser-déposer votre ${this.label} ici ou cliquer pour l'importer`;
        if (this.deviceService.isMobile)
            labelUnique = `Appuyez pour importer votre ${this.label} ou prendre une photo`;

        return this.multiple
            ? `Glisser-déposer mes ${this.label}s ici ou cliquer pour les importer`
            : labelUnique;
    }

    get acceptAttr(): string {
        return (this.acceptedFileTypes ?? []).join(', ');
    }

    openFileDialog(): void {
        this.fileInput?.nativeElement.click();
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
            let ids = await this.uploadFiles(results);
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
        let ids: string[] = [];

        try {
            for (const file of files) {
                this.fileUploading = file;
                await this.documentsService.uploadDocument(file).then((data) => {
                    ids.push(data._id);
                });
                await Utils.delay(2000);
            }
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur lors de l\'envoi',
                detail: err?.message || 'Une erreur est survenue lors de l\'envoi du fichier.',
                life: 5000
            });
            return ids;
        } finally {
            this.fileUploading = null;
            this.isUploading = false;
            return ids;
        }
    }

    private fileToBase64(file: File): Promise<Base64File> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => {
                this.messageService.add({
                    severity: 'error',
                    summary: `Erreur de lecture`,
                    detail: file.name,
                    life: 3000
                });
                reject(reader.error)
            };
            reader.onload = () => {
                const dataUrl = String(reader.result);
                const base64 = dataUrl.split(',')[1] ?? '';
                resolve({
                    name: file.name || this.newFilename(file.type),
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

    private newFilename(type: string): string {
        const ext = type.split('/').pop() ?? 'dat';
        return `file_${new Date().getTime()}.${ext}`;
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
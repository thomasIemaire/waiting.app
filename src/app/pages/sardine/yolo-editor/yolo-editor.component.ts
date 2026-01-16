import { CommonModule } from "@angular/common";
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
    ChangeDetectorRef,
    inject
} from "@angular/core";
import { FormsModule } from "@angular/forms";

// PrimeNG
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { SelectModule } from "primeng/select";
import { MessageService } from "primeng/api";

// PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Drag & Drop
import { DndFileComponent, Base64File } from "../../../components/dnd-file/dnd-file.component";
import { UserService } from "../../../core/services/user.service";
import { ApiService } from "../../../core/services/api.service";
import { SardineService, SardineDocument } from "../../../core/services/sardine.service";

// === CONFIGURATION DU WORKER ===
// On pointe vers le fichier copié via angular.json
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';

type Tool = "draw" | "erase";
type ZoneType = 'text' | 'table' | 'picture';

type Rect = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: ZoneType;
    author: string;
    loading?: boolean;
};

@Component({
    selector: "app-yolo-editor",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TooltipModule,
        SelectModule,
        DndFileComponent
    ],
    providers: [MessageService],
    template: `
    <div class="yolo-editor__wrapper">
      
      @if (!currentFile) {
        <div class="yolo-editor__empty-state">
            <app-dnd-file 
                [multiple]="false" 
                label="document" 
                [acceptedFileTypes]="['application/pdf', 'image/*']" 
                (fileBase64)="onFileImported($event)">
            </app-dnd-file>
        </div>
      } 
      
      @else {
        <div class="yolo-editor__content">
            <div class="yolo-editor__content-header">
                <div class="yolo-editor__header-left">
                    <p-select
                        class="yolo-editor__classification"
                        [options]="classificationOptions"
                        [(ngModel)]="classification"
                        optionLabel="label"
                        optionValue="value"
                        size="small"
                        appendTo="body"
                    />
                    <div class="yolo-editor__path" [title]="fullPath">
                        / {{ currentFile.name }}
                    </div>
                </div>

                <div class="yolo-editor__header-right">
                    <p-button 
                        icon="pi pi-times" 
                        text 
                        size="small"
                        severity="secondary" 
                        (onClick)="closeFile()" 
                        pTooltip="Fermer"
                        tooltipPosition="left"
                    ></p-button>
                </div>
            </div>

            <div class="yolo-editor__canvas">
                <div #pageHost class="yolo-editor__page">
                    <canvas #pageCanvas class="yolo-editor__page-canvas"></canvas>

                    <canvas
                        #overlayCanvas
                        class="yolo-editor__overlay"
                        (pointerdown)="onPointerDown($event)"
                        (pointermove)="onPointerMove($event)"
                        (pointerup)="onPointerUp($event)"
                        (pointercancel)="onPointerUp($event)"
                    ></canvas>

                    <div class="yolo-editor__layer">
                        @for (r of rects; track r.id) {
                            <div class="yolo-zone"
                                 [style.left.%]="r.x * 100"
                                 [style.top.%]="r.y * 100"
                                 [style.width.%]="r.w * 100"
                                 [style.height.%]="r.h * 100"
                                 (click)="onZoneClick($event, r)"
                                 [class.is-delete-mode]="tool === 'erase'"
                                 [ngClass]="r.type">
                                
                                 <div class="yolo-zone__type">
                                    <p-select 
                                        size="small"
                                        [(ngModel)]="r.type" 
                                        (pointerdown)="$event.stopPropagation()"
                                        (click)="$event.stopPropagation()"
                                        [options]="zoneTypes"
                                        optionLabel="label"
                                        optionValue="value"
                                        appendTo="body">
                                    </p-select>
                                 </div>
            
                                <div class="yolo-zone__author">
                                    {{ r.author }}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <div class="yolo-editor__content-footer">
                <p-button
                    icon="pi pi-angle-left"
                    severity="secondary"
                    size="small"
                    text
                    [disabled]="pageIndex === 0"
                    (onClick)="prevPage()"
                ></p-button>

                <div class="yolo-editor__pagination">
                    Page {{ pageIndex + 1 }} / {{ pageCount }}
                </div>

                <p-button
                    icon="pi pi-angle-right"
                    severity="secondary"
                    size="small"
                    text
                    [disabled]="pageIndex >= pageCount - 1"
                    (onClick)="nextPage()"
                ></p-button>
            </div>
        </div>

        <div class="yolo-editor__tools">
            <div class="yolo-editor__tools-group">
                <p-button 
                    icon="pi pi-pencil"
                    size="small"
                    [severity]="tool === 'draw' ? 'primary' : 'secondary'"
                    text
                    (onClick)="setTool('draw')"
                    pTooltip="Dessiner une zone"
                    tooltipPosition="left"
                ></p-button>
                <p-button
                    icon="pi pi-eraser"
                    size="small"
                    [severity]="tool === 'erase' ? 'primary' : 'secondary'"
                    text
                    (onClick)="setTool('erase')"
                    pTooltip="Effacer une zone"
                    tooltipPosition="left"
                ></p-button>
            </div>
            <div class="yolo-editor__tools-group">
                <p-button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger" 
                    text
                    (onClick)="deleteDocument()"
                    pTooltip="Supprimer le document définitivement"
                    tooltipPosition="left"
                ></p-button>
                <p-button
                    icon="pi pi-save"
                    size="small"
                    (onClick)="save()"
                    pTooltip="Enregistrer"
                    tooltipPosition="left"
                ></p-button>
            </div>
        </div>
      }
    </div>
  `,
    styleUrls: ["./yolo-editor.component.scss"],
})
export class YoloEditorComponent implements AfterViewInit, OnDestroy {

    currentFile: Base64File | null = null;

    // PDF State
    private pdfDoc: any = null; // Proxy PDF
    private bgImage: HTMLImageElement | null = null; // Pour les JPG/PNG

    classificationOptions: { label: string, value: string }[] = [];
    classification = "";

    get fullPath() { return `${this.classification} / ${this.currentFile?.name || ''}`; }

    pageIndex = 0;
    pageCount = 1;

    tool: Tool = "draw";
    rects: Rect[] = [];
    private drawing = false;
    private startPt?: { x: number; y: number };
    private draft?: Rect;

    // Dimensions
    private pageW = 0;
    private pageH = 0;

    private ro?: ResizeObserver;
    private resizeRaf = 0;
    private renderTask: any = null; // Pour annuler le rendu PDF si changement rapide

    @ViewChild("pageHost") pageHost?: ElementRef<HTMLDivElement>;
    @ViewChild("pageCanvas") pageCanvasRef?: ElementRef<HTMLCanvasElement>;
    @ViewChild("overlayCanvas") overlayCanvasRef?: ElementRef<HTMLCanvasElement>;

    private apiService = inject(ApiService);
    private userService = inject(UserService);
    private sardineService = inject(SardineService);
    private messageService = inject(MessageService);

    currentUser = this.userService.getUser()?.getFullname();

    zoneTypes: { label: string, value: ZoneType }[] = [
        { label: 'Texte', value: 'text' },
        { label: 'Tableau', value: 'table' },
        { label: 'Image', value: 'picture' }
    ];

    private pagesRects = new Map<number, Rect[]>();

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        // 1. Charger la liste des classifications (pour le menu déroulant)
        this.sardineService.getTree().subscribe(tree => {
            this.classificationOptions = Object.keys(tree).map(k => ({ label: k, value: k }));
            if (this.classificationOptions.length > 0) {
                this.classification = this.classificationOptions[0].value as any;
            }
        });

        // 2. Écouter l'ouverture de fichier depuis l'explorateur
        this.sardineService.documentToLoad$.subscribe(doc => {
            if (doc) {
                this.loadFromDatabase(doc);
            }
        });
    }

    ngAfterViewInit(): void { }
    ngOnDestroy(): void { this.disconnectObserver(); }

    // ======= GESTION FICHIER =======

    async onFileImported(file: Base64File) {
        this.currentFile = file;
        this.pagesRects.clear();
        this.rects = [];
        this.pageIndex = 0;
        this.pageCount = 1;
        this.bgImage = null;
        this.pdfDoc = null;

        this.cdr.detectChanges(); // Affiche le DOM
        this.initResizeObserver();

        try {
            if (file.type === 'application/pdf') {
                await this.loadPdfDocument(file.base64);
            } else if (file.type.startsWith('image/')) {
                await this.loadImage(file.dataUrl);
            }
        } catch (err) {
            console.error("Erreur chargement fichier", err);
        }
    }

    closeFile() {
        this.currentFile = null;
        this.pdfDoc = null;
        this.bgImage = null;
        this.disconnectObserver();
    }

    // --- Chargeurs ---

    private async loadPdfDocument(base64: string) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        this.pdfDoc = await loadingTask.promise;
        this.pageCount = this.pdfDoc.numPages;

        // ATTENTION : Si on est en train de charger depuis la DB, on ne veut pas forcément render la page 0 tout de suite.
        // Mais pour simplifier, on peut laisser le renderContent() ici, il sera écrasé par le renderContent() du loadFromDatabase.
        this.renderContent();
    }

    private loadImage(url: string): Promise<void> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.bgImage = img;
                this.renderContent();
                resolve();
            };
            img.src = url;
        });
    }

    // ======= RENDU CONTENU (PDF ou IMAGE) =======

    private async renderContent() {
        if (!this.pageCanvasRef || !this.pageHost) return;

        // Si Image Simple
        if (this.bgImage) {
            this.resizeCanvases(this.pageHost.nativeElement.clientWidth, this.pageHost.nativeElement.clientHeight);
            return;
        }

        // Si PDF
        if (this.pdfDoc) {
            // Annuler rendu précédent si en cours
            if (this.renderTask) {
                await this.renderTask.cancel();
                this.renderTask = null;
            }

            const page = await this.pdfDoc.getPage(this.pageIndex);

            // On calcule l'échelle pour que le PDF tienne dans le conteneur HOST
            // On récupère d'abord la taille "naturelle" du PDF
            const unscaledViewport = page.getViewport({ scale: 1 });
            const hostW = this.pageHost.nativeElement.clientWidth;

            // On veut que le PDF remplisse la largeur du conteneur
            // (Le CSS aspect-ratio s'occupe déjà de la forme du conteneur)
            const scale = hostW / unscaledViewport.width;
            const viewport = page.getViewport({ scale: scale });

            // On redimensionne les canvas à la taille exacte du rendu PDF
            this.resizeCanvases(viewport.width, viewport.height);

            const ctx = this.pageCanvasRef.nativeElement.getContext('2d');
            if (!ctx) return;

            // Rendu PDF.js
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            this.renderTask = page.render(renderContext);
            await this.renderTask.promise;
        }
    }

    // ======= ENGINE & UTILS =======

    private initResizeObserver() {
        if (!this.pageHost) return;
        this.disconnectObserver();
        this.ro = new ResizeObserver((entries) => {
            // Si la fenêtre change de taille, on relance le rendu (important pour PDF pour recalculer le scale)
            this.renderContent();
        });
        this.ro.observe(this.pageHost.nativeElement);
    }

    private disconnectObserver() {
        this.ro?.disconnect();
    }

    private resizeCanvases(w: number, h: number) {
        if (!this.pageCanvasRef || !this.overlayCanvasRef) return;
        this.pageW = w;
        this.pageH = h;

        // Configuration Hi-DPI (Retina)
        // Note: Pour PDF.js, le viewport gère déjà le scale, donc on simplifie ici
        // On aligne simplement la taille DOM et la taille interne

        const canvasList = [this.pageCanvasRef.nativeElement, this.overlayCanvasRef.nativeElement];
        for (const c of canvasList) {
            c.width = w;
            c.height = h;
        }

        // Si c'est une image, on la dessine ici (car pas besoin de traitement asynchrone complexe)
        if (this.bgImage) {
            const ctx = this.pageCanvasRef.nativeElement.getContext('2d');
            ctx?.drawImage(this.bgImage, 0, 0, w, h);
        }

        this.renderOverlay(); // Redessine les rectangles rouges par dessus
    }

    // ... (Le reste des méthodes prevPage, nextPage, drawRect, onPointer... reste identique)
    // IMPORTANT : Dans prevPage() et nextPage(), appeler this.renderContent() au lieu de redrawPage()

    prevPage() {
        if (this.pageIndex > 0) {
            // 1. Sauvegarder l'état de la page actuelle avant de partir
            this.pagesRects.set(this.pageIndex, [...this.rects]);

            this.pageIndex--;

            // 2. Restaurer l'état de la nouvelle page (ou vide si pas encore visitée)
            this.rects = this.pagesRects.get(this.pageIndex) || [];

            this.renderContent();
            this.renderOverlay();
        }
    }

    nextPage() {
        if (this.pageIndex < this.pageCount - 1) {
            // 1. Sauvegarder l'état de la page actuelle
            this.pagesRects.set(this.pageIndex, [...this.rects]);

            this.pageIndex++;

            // 2. Restaurer l'état de la nouvelle page
            this.rects = this.pagesRects.get(this.pageIndex) || [];

            this.renderContent();
            this.renderOverlay();
        }
    }

    // ... Garder les autres méthodes (setTool, onPointerDown, etc.) du message précédent
    setTool(t: Tool) { this.tool = t; }

    onPointerDown(ev: PointerEvent) {
        if (!this.overlayCanvasRef) return;
        const p = this.getNormPoint(ev);
        if (this.tool === "erase") {
            const idx = this.rects.findIndex((r) => this.pointInRect(p, r));
            if (idx >= 0) {
                this.rects.splice(idx, 1);
                this.renderOverlay();
            }
            return;
        }
        this.drawing = true;
        this.startPt = p;
        this.draft = { id: "draft", x: p.x, y: p.y, w: 0, h: 0, type: 'text', author: this.currentUser ?? "Unknown" };
        this.overlayCanvasRef.nativeElement.setPointerCapture(ev.pointerId);
        this.renderOverlay();
    }

    onPointerMove(ev: PointerEvent) {
        if (!this.drawing || this.tool !== "draw" || !this.startPt) return;
        const p = this.getNormPoint(ev);
        const r = this.rectFrom2Points(this.startPt, p);
        this.draft = { id: "draft", ...r, type: 'text', author: this.currentUser ?? "Unknown" };
        this.renderOverlay();
    }

    onPointerUp(_ev: PointerEvent) {
        if (this.tool !== "draw") return;
        if (!this.drawing) return;

        this.drawing = false;

        if (this.draft) {
            const r = this.draft;
            this.draft = undefined;

            // Check minimal size
            if (r.w > 0.005 && r.h > 0.005) {

                // Create the new rect object
                const newRect: Rect = {
                    ...r,
                    id: crypto.randomUUID(),
                    type: 'text',
                    author: this.currentUser ?? "Unknown",
                    loading: true // Mark as loading initially
                };

                // A. Optimistic Update: Add to list immediately so user sees it
                this.rects.push(newRect);

                // B. Call the API
                this.processMagneticZone(newRect);
            }
        }
        this.renderOverlay();
    }

    private processMagneticZone(rect: Rect) {
        // On vérifie que le canvas est bien là
        if (!this.pageCanvasRef) return;

        // MAGIE ICI : On capture ce qui est affiché sur le canvas (PDF rendu ou Image)
        // Cela génère une chaîne "data:image/jpeg;base64,..."
        const canvasImageBase64 = this.pageCanvasRef.nativeElement.toDataURL('image/jpeg', 0.8);

        const payload = {
            base64: canvasImageBase64, // On envoie l'image du canvas, pas le fichier brut !
            zone_data: {
                x: rect.x,
                y: rect.y,
                w: rect.w,
                h: rect.h
            },
            user_id: this.userService.getUser()?.id
        };

        this.apiService.post<any>('sardine/magnetic-zone', payload).subscribe({
            next: (response) => {
                const targetRect = this.rects.find(r => r.id === rect.id);
                if (targetRect) {
                    targetRect.x = response.x;
                    targetRect.y = response.y;
                    targetRect.w = response.w;
                    targetRect.h = response.h;
                    targetRect.loading = false;
                    if (response.type) targetRect.type = response.type;
                }
            },
            error: (err) => {
                console.error('Magnetic zone error', err);
                const targetRect = this.rects.find(r => r.id === rect.id);
                if (targetRect) targetRect.loading = false;
            }
        });
    }

    deleteDocument() {
        if (!this.currentFile) return;

        // Petite confirmation pour éviter les accidents
        if (confirm(`Voulez-vous vraiment supprimer "${this.currentFile.name}" ?`)) {

            this.sardineService.deleteDocument(this.currentFile.name, this.classification).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Supprimé',
                        detail: 'Le document a été supprimé.'
                    });

                    // On ferme l'éditeur car le fichier n'existe plus
                    this.closeFile();
                },
                error: (err) => {
                    // Si c'est un fichier local non sauvegardé (Drag & Drop pur), l'API renverra 404
                    // Dans ce cas, on le ferme simplement visuellement.
                    if (err.status === 404) {
                        this.closeFile();
                        this.messageService.add({ severity: 'info', summary: 'Fermé', detail: 'Fichier local retiré' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer' });
                    }
                }
            });
        }
    }

    detectZones() { this.renderOverlay(); }

    async loadFromDatabase(doc: SardineDocument) {
        this.closeFile(); // Reset

        const mimeType = doc.mime_type || 'image/jpeg';

        // Simuler l'objet fichier
        this.currentFile = {
            name: doc.filename,
            type: mimeType,
            base64: doc.base64,
            dataUrl: `data:${mimeType};base64,${doc.base64}`,
            size: 0,
            lastModified: 0
        };

        this.classification = doc.classification as any;
        this.pagesRects.clear();

        this.rects = doc.zones || [];
        this.pagesRects.set(this.pageIndex, this.rects);

        // Afficher
        this.cdr.detectChanges();

        // Gestion PDF vs Image
        if (mimeType === 'application/pdf') {
            await this.loadPdfDocument(doc.base64);
            this.pageIndex = doc.page_index || 0;
            this.renderContent();
        } else {
            this.pageIndex = 0;
            this.pageCount = 1;
            await this.loadImage(this.currentFile.dataUrl);
        }
    }

    // SAUVEGARDE (Logique modifiée)
    save() {
        this.pagesRects.set(this.pageIndex, this.rects);

        if (!this.currentFile) return;

        // 1. Nom de fichier (avec suffixe page si PDF)
        let filenameToSave = this.currentFile.name;

        // 2. Payload avec le BASE64 ORIGINAL
        const docPayload: SardineDocument = {
            filename: filenameToSave,
            classification: this.classification,

            // ICI : On envoie le fichier original, pas le canvas !
            base64: this.currentFile.base64,
            mime_type: this.currentFile.type,
            page_index: this.pageIndex + 1, // Important pour retrouver la page du PDF

            zones: this.rects,
            width: this.pageW,
            height: this.pageH
        };

        this.sardineService.saveDocument(docPayload).subscribe({
            next: (res: any) => {
                // ... (Succès)
                // Rafraîchir la liste si besoin
                this.sardineService.getTree().subscribe(tree => {
                    this.classificationOptions = Object.keys(tree).map(k => ({ label: k, value: k }));
                });
            },
            error: (err) => {
                // ... (Erreur)
            }
        });
    }

    private renderOverlay() {
        if (!this.overlayCanvasRef) return;
        const ctx = this.overlayCanvasRef.nativeElement.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, this.pageW, this.pageH);

        // On ne boucle plus sur this.rects ici !

        // On dessine uniquement le rectangle en cours de création
        if (this.draft) {
            this.drawRect(ctx, this.draft, true);
        }
    }

    onZoneClick(event: MouseEvent, rect: Rect) {
        // Si l'outil est "gomme", on supprime
        if (this.tool === 'erase') {
            event.stopPropagation(); // Empêche de déclencher d'autres clics
            this.rects = this.rects.filter(r => r.id !== rect.id);
            // Pas besoin de renderOverlay car Angular mettra à jour le HTML automatiquement
        }
    }

    private drawRect(ctx: CanvasRenderingContext2D, r: Rect, isDraft: boolean) {
        const x = r.x * this.pageW;
        const y = r.y * this.pageH;
        const w = r.w * this.pageW;
        const h = r.h * this.pageH;
        ctx.strokeStyle = isDraft ? "var(--primary-color, #3B82F6)" : "var(--red-500, #ef4444)";
        ctx.lineWidth = 2;
        ctx.setLineDash(isDraft ? [6, 4] : []);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = isDraft ? "rgba(59, 130, 246, 0.1)" : "rgba(239, 68, 68, 0.1)";
        ctx.fillRect(x, y, w, h);
    }

    private getNormPoint(ev: PointerEvent) {
        if (!this.overlayCanvasRef) return { x: 0, y: 0 };
        const rect = this.overlayCanvasRef.nativeElement.getBoundingClientRect();
        return {
            x: Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height)),
        };
    }

    private rectFrom2Points(a: { x: number; y: number }, b: { x: number; y: number }) {
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.abs(a.x - b.x);
        const h = Math.abs(a.y - b.y);
        return { x, y, w, h };
    }

    private pointInRect(p: { x: number; y: number }, r: Rect) {
        return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    }
}
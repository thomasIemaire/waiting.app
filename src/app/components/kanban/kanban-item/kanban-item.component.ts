import { CommonModule } from "@angular/common";
import { Component, EventEmitter, ViewChild, inject, Input, OnInit, Output, Type, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService, MenuItem } from "primeng/api";
import { ApiService } from "../../../core/services/api.service";
import { DynamicHostDirective } from "../../../core/directives/dynamic-host.directive";
import { DragPayload, KanbanDragService } from "../../../core/services/kanban-drag.service";
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { Utils } from "../../../core/utils/utils";
import { DialogService } from "primeng/dynamicdialog";
import { Form, FormsComponent } from "../../forms/forms.component";
import { SaveFooterComponent } from "../../save-footer/save-footer.component";
import { Subscription, timer, of } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";

export interface KanbanItem {
    id: string;
    name: string;
    // Endpoint global pour récupérer toutes les données de la colonne en une fois
    endpoint?: string;
    // Intervalle de rafraîchissement global (en ms)
    refreshInterval?: number;
    sections: KanbanSection[];
    dropable?: KanbanItemDroppable;
    copyOnExternalDrop?: boolean;
    onAddEndpoint?: string;
    onRemoveEndpoint?: string;
}

interface KanbanItemDroppable {
    enabled: boolean;
    acceptedFrom: string[];
}

export interface KanbanSection {
    name: string;
    // Endpoint spécifique (ignoré si endpoint global défini)
    endpoint?: string;
    // Fonction pour filtrer les données globales vers cette section
    refreshInterval?: number;
    filter?: (item: any) => boolean;
    onAddEndpoint?: string;
    onRemoveEndpoint?: string;
    removeAfterDrag?: boolean;
    draggable?: boolean;
    component: Type<any>;
    inputs?: Record<string, any>;
    add?: () => any | void;
    click?: (item: KanbanItem) => any | void;
    onAddForm?: { label: string; form: Form; };
    onAddDialog?: {
        component: Type<any>;
        header?: string;
        width?: string;
        resolveData: (item: any) => any;
    };
}

interface Column { field: string; header?: string; }

@Component({
    selector: 'app-kanban-item',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicHostDirective, ContextMenuModule],
    template: `
    <p-contextmenu #cardMenu [model]="cardMenuItems"></p-contextmenu>
    <div class="kanban-board-item__container" (dragenter)="onContainerDragEnter($event)"
        (dragleave)="onContainerDragLeave($event)" (dragover)="onContainerDragOver($event)" (drop)="onContainerDrop($event)"
        [class.drop-allowed]="canDropFromCurrent()" [class.drop-forbidden]="!canDropFromCurrent()"
        [class.is-drag-over]="containerDragOver" [class.is-drag-over-allowed]="containerDragOver && canDropFromCurrent()"
        [class.is-drag-over-forbidden]="containerDragOver && !canDropFromCurrent()">
        <div class="kanban-board-item__wrapper">
            <div class="kanban-board-item-header__wrapper">
                <span class="kanban-board-item-header__title">{{ item.name }}</span>
            </div>
            <div class="kanban-board-item-sections__wrapper">
                <div class="kanban-board-item-section__wrapper" *ngFor="let section of item.sections">
                    <div class="kanban-board-item-section__header">
                        <span class="kanban-board-item-section__title">
                            {{ section.name }}
                            <ng-container *ngIf="loading[section.name]"> · chargement…</ng-container>
                            <ng-container *ngIf="!loading[section.name]"> · {{ (data[section.name]?.length || 0)
                                }}</ng-container>
                        </span>
                        <div class="kanban-board-item-section__add" *ngIf="section.add" (click)="section.add()">
                            <i class="pi pi-plus"></i>
                        </div>
                    </div>
                    <div class="kanban-board-item-section-list"
                        *ngIf="!loading[section.name] || (data[section.name] && data[section.name].length)">
                        <div class="kanban-card"
                            *ngFor="let card of getDisplayed(section); let i = index; trackBy: trackByCard"
                            [class.is-draggable]="isCardDraggable(section, card)"
                            [attr.draggable]="isCardDraggable(section, card) ? true : null"
                            (click)="section.click ? section.click(card) : null"
                            (dragstart)="onDragStart(section, card, i, $event)" (dragend)="onDragEnd($event)"
                            (contextmenu)="onCardContextMenu($event, section, card)">
                            <ng-container [appDynamicHost]="section.component" [inputs]="getInputs(card, section.inputs)">
                            </ng-container>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`,
    styleUrls: ['./kanban-item.component.scss'],
    providers: [DialogService]
})
export class KanbanItemComponent implements OnInit, OnDestroy {
    @Input({ required: true }) public item!: KanbanItem;
    @Input() public search = '';
    @Input() public searchOnlyCols: Column[] = [];
    @Input() public filterOnCol = '';
    @Input() public sortOrder: number = 1;
    @Input() public defaultDropSectionName = 'En attente';
    @Output() public columnsFound = new EventEmitter<string[]>();

    private api: ApiService = inject(ApiService);
    private messages: MessageService = inject(MessageService);
    private drag = inject(KanbanDragService);
    private dialogService: DialogService = inject(DialogService);

    public data: Record<string, any[]> = {};
    public loading: Record<string, boolean> = {};

    private subscriptions: Subscription[] = [];

    @ViewChild('cardMenu') cardMenu!: ContextMenu;
    public cardMenuItems: MenuItem[] = [
        {
            label: 'Supprimer',
            icon: 'pi pi-trash',
            command: () => this.deleteContextCard()
        }
    ];
    private ctxSection?: KanbanSection;
    private ctxRecord: any | undefined;

    ngOnInit() {
        // Si un endpoint global est configuré, on l'utilise pour alimenter toutes les sections
        if (this.item.endpoint) {
            this.initSharedData();
        } else {
            // Sinon, comportement classique (1 appel par section)
            this.initSectionsIndividually();
        }
    }

    ngOnDestroy() {
        this.unsubscribeAll();
    }

    public getInputs(card: any, sectionInputs: any): any {
        return { data: card, ...(sectionInputs || {}) };
    }

    public reload(): void {
        this.unsubscribeAll();
        this.ngOnInit();
    }

    private unsubscribeAll() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions = [];
    }

    // --- LOGIQUE DONNÉES PARTAGÉES (1 Appel) ---

    private initSharedData() {
        const ep = this.normalizeEndpoint(this.item.endpoint!);

        // Initialiser le loading pour toutes les sections
        this.item.sections.forEach(s => this.loading[s.name] = true);

        // Configuration du polling ou appel unique
        const request$ = (this.item.refreshInterval && this.item.refreshInterval > 0)
            ? timer(0, this.item.refreshInterval).pipe(switchMap(() => this.api.get<any[]>(ep)))
            : this.api.get<any[]>(ep);

        const sub = request$.pipe(
            catchError(err => {
                console.error(`Erreur chargement colonne ${this.item.name}`, err);
                // Arrêter le loading en cas d'erreur
                this.item.sections.forEach(s => this.loading[s.name] = false);
                return of([]); // Retourner tableau vide pour continuer le flux si besoin
            })
        ).subscribe((rows) => {
            this.distributeData(rows);
        });

        this.subscriptions.push(sub);
    }

    private distributeData(rows: any[]) {
        rows = Utils._id2id(rows);
        const allRows = Array.isArray(rows) ? rows : (rows ? [rows] : []);

        // Détection des colonnes sur l'ensemble des données
        this.detectColumns(allRows);

        // Répartition dans les sections via la fonction filter
        this.item.sections.forEach(section => {
            if (section.filter) {
                this.data[section.name] = allRows.filter(section.filter);
            } else {
                // Fallback si pas de filtre : on ne met rien ou tout (ici rien par sécurité)
                this.data[section.name] = [];
            }
            this.loading[section.name] = false;
        });
    }

    // --- LOGIQUE DONNÉES INDIVIDUELLES (Legacy) ---

    private initSectionsIndividually() {
        for (const section of this.item.sections) {
            if (!section.endpoint) continue;

            if (section.refreshInterval && section.refreshInterval > 0) {
                this.startSectionPolling(section);
            } else {
                this.fetchSectionOnce(section);
            }
        }
    }

    private startSectionPolling(section: KanbanSection) {
        if (!this.data[section.name]) this.loading[section.name] = true;
        const ep = this.normalizeEndpoint(section.endpoint!);

        if (!section.refreshInterval || section.refreshInterval <= 0) return;

        const sub = timer(0, section.refreshInterval)
            .pipe(switchMap(() => this.api.get<any[]>(ep)))
            .subscribe({
                next: (rows) => this.processSectionData(section, rows),
                error: (err) => this.handleSectionError(section, err)
            });
        this.subscriptions.push(sub);
    }

    private fetchSectionOnce(section: KanbanSection) {
        this.loading[section.name] = true;
        const ep = this.normalizeEndpoint(section.endpoint!);

        this.api.get<any[]>(ep).subscribe({
            next: (rows) => this.processSectionData(section, rows),
            error: (err) => this.handleSectionError(section, err)
        });
    }

    private processSectionData(section: KanbanSection, rows: any) {
        rows = Utils._id2id(rows);
        const arr = Array.isArray(rows) ? rows : (rows ? [rows] : []);
        this.data[section.name] = arr;
        this.loading[section.name] = false;
        this.detectColumns(arr);
    }

    // --- UTILITAIRES ---

    private detectColumns(rows: any[]) {
        const fields = new Set<string>();
        for (const r of rows) {
            Object.keys(r || {}).forEach(k => {
                const v = (r as any)[k];
                if (['string', 'number', 'boolean'].includes(typeof v)) fields.add(k);
            });
        }
        if (fields.size) this.columnsFound.emit(Array.from(fields));
    }

    private handleSectionError(section: KanbanSection, err: any) {
        this.loading[section.name] = false;
        console.error(`Erreur section ${section.name}`, err);
    }

    private normalizeEndpoint(endpoint: string): string {
        return (endpoint || '').trim().replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\/+/, '').replace(/^api\/+/, '');
    }

    // --- RENDU & FILTRES VISUELS ---

    getDisplayed(section: KanbanSection): any[] {
        const arr = (this.data[section.name] || []).slice();
        const q = (this.search || '').trim().toLowerCase();

        // Filtrage recherche textuelle
        let filtered = arr;
        if (q) {
            const only = this.searchOnlyCols?.map(c => c.field) || [];
            filtered = arr.filter(rec => this.matchesQuery(rec, q, only));
        }

        // Tri
        return filtered.sort((a, b) => this.compare(a, b));
    }

    private matchesQuery(rec: any, q: string, onlyFields: string[]) {
        const keys = onlyFields.length ? onlyFields : Object.keys(rec || {});
        for (const k of keys) {
            const v = rec?.[k];
            if (v === null || v === undefined) continue;
            if (String(v).toLowerCase().includes(q)) return true;
        }
        return false;
    }

    private compare(a: any, b: any): number {
        const field = this.filterOnCol || this.pickBestField(a, b);
        if (!field) return 0;
        const sa = String(a?.[field] ?? '').toLowerCase();
        const sb = String(b?.[field] ?? '').toLowerCase();
        if (sa < sb) return -1 * this.sortOrder;
        if (sa > sb) return 1 * this.sortOrder;
        return 0;
    }

    private pickBestField(a: any, b: any): string | null {
        const candidates = ['name', 'title', 'label', 'id'];
        for (const c of candidates) {
            if (a?.[c] !== undefined || b?.[c] !== undefined) return c;
        }
        return null;
    }

    trackByCard = (_: number, rec: any) => rec?.id ?? JSON.stringify(rec);

    // --- DRAG & DROP ---

    public containerDragOver = false;
    private containerDragDepth = 0;

    private cloneRecord<T>(obj: T): T {
        try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
    }

    isCardDraggable(section: KanbanSection, card: any): boolean {
        if (typeof card?.draggable === 'boolean') return card.draggable;
        if (typeof section?.draggable === 'boolean') return section.draggable;
        return true;
    }

    onContainerDragEnter(_ev: DragEvent) {
        if (!this.drag.peek()) return;
        this.containerDragDepth++;
        this.containerDragOver = true;
    }

    onContainerDragLeave(_ev: DragEvent) {
        this.containerDragDepth = Math.max(0, this.containerDragDepth - 1);
        if (this.containerDragDepth === 0) this.containerDragOver = false;
    }

    onContainerDragOver(ev: DragEvent) {
        const p = this.drag.peek();
        if (!p) return;
        this.containerDragOver = true;
        if (this.canAccept(p) && !!this.getTargetSection()) {
            ev.preventDefault();
            ev.dataTransfer!.dropEffect = 'move';
        } else {
            ev.dataTransfer!.dropEffect = 'none';
        }
    }

    onContainerDrop(ev: DragEvent) {
        ev.preventDefault();
        this.containerDragDepth = 0;
        this.containerDragOver = false;

        const p = this.drag.consume();
        if (!p) return;

        // ... vérifications existantes (providerId, canAccept) ...
        if (p.providerId === this.item.id) { /* ... */ return; }
        if (!this.canAccept(p)) { /* ... */ return; }

        const target = this.getTargetSection();
        if (!target) { /* ... */ return; }

        // Fonction qui exécute le déplacement final (API call + UI update)
        const proceed = (extraData: any = {}) => {
            // Optimisation : ajout local immédiat
            const recToAdd = this.cloneRecord(p.record);

            // Logique de changement de statut visuel
            if (this.item.endpoint && target.name === 'En attente') recToAdd.status = 'to-build'; // ou 'to-train' selon contexte
            else if (this.item.endpoint && target.name === 'En cours') recToAdd.status = 'in-building'; // ou 'in-training'

            this.addCard(target, recToAdd);

            if (!p.copyOnExternalDrop) {
                try { p.removeFromSource(); } catch { }
            }

            const addEp = target.onAddEndpoint || this.item.onAddEndpoint;
            if (addEp) {
                const ep = this.normalizeEndpoint(addEp.replace('{id}', recToAdd.id || ''));
                this.api.post(ep, extraData).subscribe({
                    next: () => {
                        this.messages.add({ severity: 'success', summary: 'Succès', detail: 'Élément déplacé avec succès.' });
                        if (this.item.endpoint) this.reload();
                    },
                    error: (err) => {
                        this.messages.add({ severity: 'error', summary: 'Erreur', detail: `Erreur lors du déplacement : ${err.message}` });
                    }
                });
            }
        };

        // --- NOUVELLE LOGIQUE ---
        // 1. Priorité au Dialog Custom
        if (target.onAddDialog) {
            this.openCustomDialog(target, p.record, proceed);
        }
        // 2. Sinon, formulaire générique
        else if (target.onAddForm) {
            this.openAddForm(target, proceed);
        }
        // 3. Sinon, exécution directe
        else {
            proceed();
        }
    }

    // --- AJOUTER CETTE MÉTHODE ---
    private openCustomDialog(target: KanbanSection, record: any, callback: (extraData?: any) => void) {
        if (!target.onAddDialog) return;

        const config = target.onAddDialog;
        // On génère les données dynamiques basées sur l'item droppé
        const dialogData = config.resolveData(record);

        const ref = this.dialogService.open(config.component, {
            header: config.header || 'Confirmation',
            width: config.width || '50vw',
            contentStyle: { overflow: 'auto' },
            modal: true,
            appendTo: 'body',
            data: dialogData
        });

        ref?.onClose.subscribe((confirmed: boolean) => {
            if (confirmed) {
                // Si la dialog renvoie true, on procède au drop
                callback();
            } else {
                // Sinon on annule le drag
                this.drag.clear();
            }
        });
    }

    private openAddForm(target: KanbanSection, callback: (data: any) => void) {
        const formPayload = JSON.parse(JSON.stringify(target.onAddForm));
        const ref = this.dialogService.open(FormsComponent, {
            header: target.onAddForm?.label || 'Configuration',
            width: '400px',
            modal: true,
            inputValues: { form: formPayload.form },
            templates: { footer: SaveFooterComponent }
        });

        ref?.onClose.subscribe((result: any) => {
            if (result?.result) {
                const formData: any = {};
                // ... (logique extraction form inchangée)
                formPayload.form.items.forEach((it: any) => {
                    const key = it.key || it.label.toLowerCase().replace(/[^a-z0-9]/g, "_");
                    formData[key] = it.value;
                });
                callback(formData);
            } else {
                this.drag.clear();
            }
        });
    }

    onDragStart(section: KanbanSection, card: any, _index: number, ev: DragEvent) {
        if (!this.isCardDraggable(section, card)) {
            ev.preventDefault(); ev.stopPropagation(); return;
        }
        ev.dataTransfer?.setData('text/plain', 'move');
        this.drag.start({
            providerId: this.item.id,
            fromSection: section.name,
            record: card,
            removeFromSource: () => {
                if (section.removeAfterDrag) this.removeCardByRecord(section, card);
            },
            copyOnExternalDrop: !!this.item.copyOnExternalDrop
        });
    }

    onDragEnd(_ev: DragEvent) { this.drag.clear(); }

    private canAccept(p: DragPayload): boolean {
        if (p.providerId === this.item.id) return false;
        const cfg = this.item.dropable;
        return !!cfg?.enabled && (cfg.acceptedFrom || []).includes(p.providerId);
    }

    canDropFromCurrent(): boolean {
        const p = this.drag.peek();
        return !!p && this.canAccept(p) && !!this.getTargetSection();
    }

    private getTargetSection(): KanbanSection | undefined {
        const wanted = (this.defaultDropSectionName || '').trim().toLowerCase();
        return this.item.sections.find(s => s.name.trim().toLowerCase() === wanted);
    }

    private removeCardByRecord(section: KanbanSection, record: any) {
        const arr = this.data[section.name] || [];
        const idx = arr.findIndex(x => x?.id === record?.id);
        if (idx >= 0) arr.splice(idx, 1);

        const removeEp = section.onRemoveEndpoint || this.item.onRemoveEndpoint;
        if (removeEp) {
            const ep = this.normalizeEndpoint(removeEp.replace('{id}', record.id || ''));
            this.api.delete(ep).subscribe();
        }
    }

    private addCard(section: KanbanSection, record: any) {
        const arr = this.data[section.name] || (this.data[section.name] = []);
        arr.push(record);
    }

    // --- CONTEXT MENU ---
    onCardContextMenu(event: MouseEvent, section: KanbanSection, record: any) {
        // Afficher le menu seulement si suppression possible
        if (!section.onRemoveEndpoint && !this.item.onRemoveEndpoint) return;
        this.ctxSection = section;
        this.ctxRecord = record;
        this.cardMenu.show(event);
        event.preventDefault();
        event.stopPropagation();
    }

    deleteContextCard() {
        if (!this.ctxSection || !this.ctxRecord) return;
        this.removeCardByRecord(this.ctxSection, this.ctxRecord);
        this.messages.add({ severity: 'success', summary: 'Supprimé', detail: 'La carte a été supprimée.' });
        this.ctxSection = undefined;
        this.ctxRecord = undefined;
    }
}
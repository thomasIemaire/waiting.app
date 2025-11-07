import { CommonModule } from "@angular/common";
import { Component, EventEmitter, ViewChild, inject, Input, OnInit, Output, Type } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService, MenuItem } from "primeng/api";
import { ApiService } from "../../../core/services/api.service";
import { DynamicHostDirective } from "../../../core/directives/dynamic-host.directive";
import { DragPayload, KanbanDragService } from "../../../core/services/kanban-drag.service";
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { Utils } from "../../../core/utils/utils";

export interface KanbanItem {
    id: string;
    name: string;
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
    endpoint: string;
    onAddEndpoint?: string;
    onRemoveEndpoint?: string;
    draggable?: boolean;
    component: Type<any>;
    add?: () => any | void;
    click?: (item: KanbanItem) => any | void;
}
interface Column { field: string; header?: string; }

@Component({
    selector: 'app-kanban-item',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicHostDirective, ContextMenuModule],
    template: `
  <!-- Menu contextuel global, affiché au clic droit d'une carte -->
  <p-contextmenu #cardMenu [model]="cardMenuItems"></p-contextmenu>

  <div class="kanban-board-item__container"
       (dragenter)="onContainerDragEnter($event)"
       (dragleave)="onContainerDragLeave($event)"
       (dragover)="onContainerDragOver($event)"
       (drop)="onContainerDrop($event)"
       [class.drop-allowed]="canDropFromCurrent()"
       [class.drop-forbidden]="!canDropFromCurrent()"
       [class.is-drag-over]="containerDragOver"
       [class.is-drag-over-allowed]="containerDragOver && canDropFromCurrent()"
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
              <ng-container *ngIf="!loading[section.name]"> · {{ (data[section.name]?.length || 0) }}</ng-container>
            </span>

            <div class="kanban-board-item-section__add"
                 *ngIf="section.add"
                 (click)="section.add()">
              <i class="pi pi-plus"></i>
            </div>
          </div>

          <div class="kanban-board-item-section-list" *ngIf="!loading[section.name]">
            <div class="kanban-card"
                 *ngFor="let card of getDisplayed(section); let i = index; trackBy: trackByCard"
                 [class.is-draggable]="isCardDraggable(section, card)"
                 [attr.draggable]="isCardDraggable(section, card) ? true : null"
                 (click)="section.click ? section.click(card) : null"
                 (dragstart)="onDragStart(section, card, i, $event)"
                 (dragend)="onDragEnd($event)"
                 (contextmenu)="onCardContextMenu($event, section, card)">

              <ng-container
                [appDynamicHost]="section.component"
                [inputs]="{ data: card }">
              </ng-container>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
    styleUrls: ['./kanban-item.component.scss']
})
export class KanbanItemComponent implements OnInit {
    @Input({ required: true }) public item!: KanbanItem;

    @Input() public search = '';
    @Input() public searchOnlyCols: Column[] = [];
    @Input() public filterOnCol = '';
    @Input() public sortOrder: number = 1;

    /** Section cible par défaut lors d'un drop sur le conteneur */
    @Input() public defaultDropSectionName = 'En attente';

    @Output() public columnsFound = new EventEmitter<string[]>();

    private api: ApiService = inject(ApiService);
    private messages: MessageService = inject(MessageService);
    private drag = inject(KanbanDragService);

    public data: Record<string, any[]> = {};
    public loading: Record<string, boolean> = {};

    // ----- Context menu -----
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
        for (const section of this.item.sections) {
            this.fetchSection(section);
        }
    }

    private normalizeEndpoint(endpoint: string): string {
        return (endpoint || '')
            .trim()
            .replace(/^https?:\/\/[^/]+\/?/, '')
            .replace(/^\/+/, '')
            .replace(/^api\/+/, '');
    }

    private fetchSection(section: KanbanSection) {
        this.loading[section.name] = true;
        const ep = this.normalizeEndpoint(section.endpoint);

        this.api.get<any[]>(ep).subscribe({
            next: (rows) => {
                rows = Utils._id2id(rows);
                const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
                this.data[section.name] = arr;
                this.loading[section.name] = false;

                const fields = new Set<string>();
                for (const r of arr) {
                    Object.keys(r || {}).forEach(k => {
                        const v = (r as any)[k];
                        if (['string', 'number', 'boolean'].includes(typeof v)) fields.add(k);
                    });
                }
                if (fields.size) this.columnsFound.emit(Array.from(fields));
            },
            error: (err) => {
                this.loading[section.name] = false;
                this.messages.add({
                    severity: 'warn',
                    summary: `API indisponible — ${this.item.name} / ${section.name}`,
                    detail: `${err?.error?.message || err?.message || 'Requête échouée'}.`
                });
            }
        });
    }

    getDisplayed(section: KanbanSection): any[] {
        const arr = (this.data[section.name] || []).slice();
        const q = (this.search || '').trim().toLowerCase();
        if (q) {
            const only = this.searchOnlyCols?.map(c => c.field) || [];
            return arr.filter(rec => this.matchesQuery(rec, q, only)).sort((a, b) => this.compare(a, b));
        }
        return arr.sort((a, b) => this.compare(a, b));
    }

    private matchesQuery(rec: any, q: string, onlyFields: string[]) {
        const keys = onlyFields.length ? onlyFields : Object.keys(rec || {});
        for (const k of keys) {
            const v = rec?.[k];
            if (v === null || v === undefined) continue;
            const s = String(v).toLowerCase();
            if (s.includes(q)) return true;
        }
        return false;
    }

    private compare(a: any, b: any): number {
        const field = this.filterOnCol || this.pickBestField(a, b);
        if (!field) return 0;
        const va = a?.[field];
        const vb = b?.[field];
        const sa = (va == null) ? '' : String(va).toLowerCase();
        const sb = (vb == null) ? '' : String(vb).toLowerCase();
        if (sa < sb) return -1 * this.sortOrder;
        if (sa > sb) return 1 * this.sortOrder;
        return 0;
    }

    private pickBestField(a: any, b: any): string | null {
        const candidates = ['name', 'title', 'label', 'id'];
        for (const c of candidates) {
            if (a?.[c] !== undefined || b?.[c] !== undefined) return c;
        }
        const keys = Object.keys(a || {});
        const k = keys.find(k0 => ['string', 'number', 'boolean'].includes(typeof a?.[k0]));
        return k || null;
    }

    primaryLabel(rec: any): string {
        return rec?.name ?? rec?.title ?? rec?.label ?? String(rec?.id ?? 'Élément');
    }
    secondaryLabel(rec: any): string | null {
        const alt = ['status', 'state', 'version', 'type', 'dataset', 'model'];
        for (const k of alt) if (rec?.[k] !== undefined) return `${k}: ${rec[k]}`;
        return null;
    }

    trackByCard = (_: number, rec: any) =>
        rec?.id ?? rec?.name ?? rec?.title ?? JSON.stringify(rec);

    onAdd(section: KanbanSection) {
        this.messages.add({
            severity: 'info',
            summary: 'Ajouter',
            detail: `Action d’ajout sur « ${this.item.name} / ${section.name} » (à implémenter).`
        });
    }

    // ---------------- DRAG & DROP ----------------
    public containerDragOver = false;
    private containerDragDepth = 0;

    // Clone sûr
    private cloneRecord<T>(obj: T): T {
        try { return structuredClone(obj); }
        catch { return JSON.parse(JSON.stringify(obj)); }
    }

    // Détermine si une carte est déplaçable (card > section > défaut true)
    isCardDraggable(section: KanbanSection, card: any): boolean {
        if (typeof card?.draggable === 'boolean') return card.draggable;
        if (typeof section?.draggable === 'boolean') return section.draggable;
        return true;
    }

    // Survol: entrée
    onContainerDragEnter(_ev: DragEvent) {
        if (!this.drag.peek()) return;
        this.containerDragDepth++;
        this.containerDragOver = true;
    }

    // Survol: leave
    onContainerDragLeave(_ev: DragEvent) {
        this.containerDragDepth = Math.max(0, this.containerDragDepth - 1);
        if (this.containerDragDepth === 0) {
            this.containerDragOver = false;
        }
    }

    // Survol: over
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

    // Drop
    onContainerDrop(ev: DragEvent) {
        ev.preventDefault();
        this.containerDragDepth = 0;
        this.containerDragOver = false;

        const p = this.drag.consume();
        if (!p) return;

        // ⛔ Interdit: même conteneur
        if (p.providerId === this.item.id) {
            this.messages.add({
                severity: 'warn',
                summary: 'Dépôt interdit',
                detail: `Impossible de déposer un élément dans son propre conteneur (« ${this.item.name} »).`
            });
            return;
        }

        if (!this.canAccept(p)) {
            this.messages.add({
                severity: 'warn',
                summary: 'Dépôt refusé',
                detail: `« ${this.item.name} » n’accepte pas d’éléments provenant de « ${p.providerId} ».`
            });
            return;
        }

        const target = this.getTargetSection();
        if (!target) {
            this.messages.add({
                severity: 'error',
                summary: 'Section cible introuvable',
                detail: `Aucune section « ${this.defaultDropSectionName} » dans « ${this.item.name} ».`
            });
            this.drag.clear();
            return;
        }

        const recToAdd = this.cloneRecord(p.record);
        this.addCard(target, recToAdd);

        if (!p.copyOnExternalDrop) {
            try { p.removeFromSource(); } catch { }
        }

        // Si un endpoint d’ajout est défini, on l’appelle
        const addEp = target.onAddEndpoint || this.item.onAddEndpoint;
        if (addEp) {
            const ep = this.normalizeEndpoint(addEp.replace('{id}', recToAdd.id || ''));
            this.api.post(ep, {}).subscribe({
                next: () => {
                    this.messages.add({
                        severity: 'success',
                        summary: 'Élément ajouté',
                        detail: `L’élément a été ajouté avec succès à « ${this.item.name} / ${target.name} ».`
                    });
                },
                error: (err) => {
                    this.messages.add({
                        severity: 'error',
                        summary: 'Erreur lors de l’ajout',
                        detail: `Impossible d’ajouter l’élément à « ${this.item.name} / ${target.name} » : ${err.message}`
                    });
                }
            });
        }
    }

    onDragStart(section: KanbanSection, card: any, _index: number, ev: DragEvent) {
        // ⛔ Si la carte n'est pas draggable, on annule tout de suite
        if (!this.isCardDraggable(section, card)) {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }

        ev.dataTransfer?.setData('text/plain', 'move');
        ev.dataTransfer?.setDragImage?.((ev.target as HTMLElement), 10, 10);
        ev.dataTransfer!.effectAllowed = 'move';

        this.drag.start({
            providerId: this.item.id,
            fromSection: section.name,
            record: card,
            // ⚠️ Retrait par record pour être robuste au tri/filtre
            removeFromSource: () => this.removeCardByRecord(section, card),
            copyOnExternalDrop: !!this.item.copyOnExternalDrop
        });
    }

    onDragEnd(_ev: DragEvent) {
        this.drag.clear();
    }

    // Règle d’acceptation :
    private canAccept(p: DragPayload): boolean {
        // Refus direct pour même conteneur (cohérent avec l’UX)
        if (p.providerId === this.item.id) return false;
        const cfg = this.item.dropable;
        if (!cfg?.enabled) return false;
        return (cfg.acceptedFrom || []).includes(p.providerId);
    }

    // Pour le style du conteneur
    canDropFromCurrent(): boolean {
        const p = this.drag.peek();
        return !!p && this.canAccept(p) && !!this.getTargetSection();
    }

    private getTargetSection(): KanbanSection | undefined {
        const wanted = (this.defaultDropSectionName || '').trim().toLowerCase();
        return this.item.sections.find(s => s.name.trim().toLowerCase() === wanted);
    }

    private removeCard(section: KanbanSection, index: number) {
        const arr = this.data[section.name] || [];
        if (index >= 0 && index < arr.length) arr.splice(index, 1);
    }

    private removeCardByRecord(section: KanbanSection, record: any) {
        const arr = this.data[section.name] || [];
        const idx = arr.findIndex(x => x === record || (x?.id && record?.id && x.id === record.id));
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

    // --------- Context menu handlers ----------
    onCardContextMenu(event: MouseEvent, section: KanbanSection, record: any) {
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
        this.clearContext();
    }

    private clearContext() {
        this.ctxSection = undefined;
        this.ctxRecord = undefined;
    }
}

import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnInit, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ApiService } from "../../../core/services/api.service";

export interface KanbanItem {
    id: string;
    name: string;
    sections: KanbanSection[];
    dropable?: KanbanItemDroppable;
    draggable?: boolean;
}
interface KanbanItemDroppable {
    dropable: boolean;
    acceptedFrom: string[];
}
export interface KanbanSection {
    name: string;
    endpoint: string; // peut être '/api/xxx' ou 'xxx' : on normalise
    add?: boolean;
}

interface Column { field: string; header?: string; }

@Component({
    selector: 'app-kanban-item',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="kanban-board-item__container">
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
                            (click)="onAdd(section)">
                            <i class="pi pi-plus"></i>
                        </div>
                    </div>

                    <div class="kanban-board-item-section-list" *ngIf="!loading[section.name]">
                        <div class="kanban-card"
                            *ngFor="let card of getDisplayed(section); trackBy: trackByCard">
                            <div class="kanban-card__title">{{ primaryLabel(card) }}</div>
                            <div class="kanban-card__subtitle" *ngIf="secondaryLabel(card)">{{ secondaryLabel(card) }}</div>
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

    @Output() public columnsFound = new EventEmitter<string[]>();

    private api: ApiService = inject(ApiService);
    private messages: MessageService = inject(MessageService);

    constructor() { }

    public data: Record<string, any[]> = {};
    public loading: Record<string, boolean> = {};

    ngOnInit() {
        for (const section of this.item.sections) {
            this.fetchSection(section);
        }
    }

    private normalizeEndpoint(endpoint: string): string {
        // Accepte '/api/foo', 'api/foo', '/foo', 'foo' -> renvoie 'foo'
        return (endpoint || '')
            .trim()
            .replace(/^https?:\/\/[^/]+\/?/, '') // si jamais on te passe une URL absolue
            .replace(/^\/+/, '')
            .replace(/^api\/+/, '');
    }

    private fetchSection(section: KanbanSection) {
        this.loading[section.name] = true;
        const ep = this.normalizeEndpoint(section.endpoint);

        this.api.get<any[]>(ep).subscribe({
            next: (rows) => {
                const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
                this.data[section.name] = arr;
                this.loading[section.name] = false;

                // Détection de colonnes primitives pour recherche/tri
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
                this.data[section.name] = [];
                this.loading[section.name] = false;
                this.messages.add({
                    severity: 'error',
                    summary: `Erreur chargement — ${this.item.name} / ${section.name}`,
                    detail: (err?.error?.message || err?.message || 'Requête échouée')
                });
            }
        });
    }

    getDisplayed(section: KanbanSection): any[] {
        const arr = (this.data[section.name] || []).slice();
        const q = (this.search || '').trim().toLowerCase();
        if (q) {
            const only = this.searchOnlyCols?.map(c => c.field) || [];
            return arr
                .filter(rec => this.matchesQuery(rec, q, only))
                .sort((a, b) => this.compare(a, b));
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
        const sa = (va === undefined || va === null) ? '' : String(va).toLowerCase();
        const sb = (vb === undefined || vb === null) ? '' : String(vb).toLowerCase();
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
        // Ici tu pourras appeler this.api.post(...) vers l’endpoint de création voulu
        this.messages.add({
            severity: 'info',
            summary: 'Ajouter',
            detail: `Action d’ajout sur « ${this.item.name} / ${section.name} » (à implémenter).`
        });
    }
}

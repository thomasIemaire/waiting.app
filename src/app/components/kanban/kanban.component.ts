import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";

import { KanbanItem, KanbanItemComponent } from "./kanban-item/kanban-item.component";

export interface Column { field: string; header?: string; }

@Component({
    selector: 'app-kanban',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ToastModule,
        MultiSelectModule, InputTextModule, SelectModule, ButtonModule,
        KanbanItemComponent
    ],
    template: `
  <div class="kanban-board__container">
    <div class="kanban-board-search__wrapper">
      <input pInputText [(ngModel)]="search" type="text" pSize="small" placeholder="Rechercher" fluid />
      <p-multiselect
        [options]="cols"
        [(ngModel)]="searchOnlyCols"
        optionLabel="field"
        size="small"
        placeholder="Rechercher sur les champs"
        [showHeader]="false"
        selectedItemsLabel="{0} champs sélectionnés" />

      <span class="mx-2">Trier sur</span>
      <p-select
        size="small"
        [options]="cols"
        [(ngModel)]="filterOnCol"
        optionLabel="field"
        optionValue="field"
        placeholder="Selectionner un champ" />
      <p-button
        text severity="secondary" type="button"
        [icon]="sortOrder === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
        size="small"
        (click)="sortOrder = -sortOrder">
      </p-button>
    </div>

    <div class="kanban-board__wrapper">
      <app-kanban-item
        *ngFor="let item of items"
        [item]="item"
        [search]="search"
        [searchOnlyCols]="searchOnlyCols"
        [filterOnCol]="filterOnCol"
        [sortOrder]="sortOrder"
        (columnsFound)="onColumnsFound($event)">
      </app-kanban-item>
    </div>
  </div>
  `,
    styleUrls: ['./kanban.component.scss']
})
export class KanbanComponent {
    @Input({ required: true }) public items!: KanbanItem[];

    public search = '';
    public cols: Column[] = [];
    public searchOnlyCols: Column[] = [];
    public filterOnCol = '';
    public sortOrder: number = 1;

    onColumnsFound(fields: string[]) {
        const existing = new Set(this.cols.map(c => c.field));
        let changed = false;
        for (const f of fields) {
            if (!existing.has(f)) {
                this.cols.push({ field: f });
                existing.add(f);
                changed = true;
            }
        }
        if (changed && this.filterOnCol && !existing.has(this.filterOnCol)) {
            this.filterOnCol = '';
        }
        this.searchOnlyCols = this.searchOnlyCols.filter(c => existing.has(c.field));
    }
}

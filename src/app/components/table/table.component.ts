import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TableModule } from "primeng/table";
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';

export interface Column {
    field: string;
    header: string;
    sortable?: boolean;
}

@Component({
    selector: 'app-table',
    imports: [CommonModule, FormsModule, TableModule, MultiSelectModule, InputTextModule],
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
})
export class TableComponent {
    @Input()
    public tableTitle!: string;

    @Input({ required: true })
    public cols!: Column[];

    @Input({ required: true })
    public data!: any[];

    @Output()
    public selectionChange = new EventEmitter<any>();

    public searchOnlyCols: Column[] = [];

    public search: string = '';

    public searchData: any[] = [];

    ngOnInit() {
        this.searchOnlyCols = this.cols;
        this.searchData = this.data;
    }

    public onSearchChange(): void {
        if (this.search.trim() === '') {
            this.searchData = this.data;
            return;
        }
        const searchLower = this.search.toLowerCase();
        this.searchData = this.data.filter(item =>
            this.searchOnlyCols.some(col =>
                item[col.field]?.toString().toLowerCase().includes(searchLower)
            )
        );
    }

    public onSelectionChange(selectedRow: any): void {
        this.selectionChange.emit(selectedRow);
    }
}
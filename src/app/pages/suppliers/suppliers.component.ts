import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { TableComponent, Column } from "../../components/table/table.component";
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

@Component({
    selector: 'app-suppliers',
    imports: [CommonModule, TableComponent, ToastModule],
    template: `
    <p-toast />
    <div class="suppliers__wrapper">
        <app-table tableTitle="Vos fournisseurs" [cols]="cols" [data]="[]"></app-table>
    </div>
    `,
    styleUrls: ['./suppliers.component.scss'],
    providers: [MessageService]
})
export class SuppliersComponent {
    public cols: Column[] = [
        { field: 'nom', header: 'Nom' },
        { field: 'type', header: 'Type' },
        { field: 'flux', header: 'Flux' },
        { field: 'status', header: 'Statut' },
        { field: 'date', header: 'Date' },
    ];
}
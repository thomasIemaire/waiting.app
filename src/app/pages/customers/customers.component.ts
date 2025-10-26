import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { TableComponent, Column } from "../../components/table/table.component";
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

@Component({
    selector: 'app-customers',
    imports: [CommonModule, TableComponent, ToastModule],
    template: `
    <p-toast />
    <div class="customers__wrapper">
        <app-table tableTitle="Mes clients" [cols]="cols" [data]="[]"></app-table>
    </div>
    `,
    styleUrls: ['./customers.component.scss'],
    providers: [MessageService]
})
export class CustomersComponent {
    public cols: Column[] = [
        { field: 'nom', header: 'Nom' },
        { field: 'type', header: 'Type' },
        { field: 'flux', header: 'Flux' },
        { field: 'status', header: 'Statut' },
        { field: 'date', header: 'Date' },
    ];
}
import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { TableComponent, Column } from "../../components/table/table.component";
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

@Component({
    selector: 'app-contacts',
    imports: [CommonModule, TableComponent, ToastModule],
    template: `
    <p-toast />
    <div class="contacts__wrapper">
        <app-table tableTitle="Vos contacts" [cols]="cols" [data]="[]"></app-table>
    </div>
    `,
    styleUrls: ['./contacts.component.scss'],
    providers: [MessageService]
})
export class ContactsComponent {
    public cols: Column[] = [
        { field: 'nom', header: 'Nom' },
        { field: 'type', header: 'Type' },
        { field: 'flux', header: 'Flux' },
        { field: 'status', header: 'Statut' },
        { field: 'date', header: 'Date' },
    ];
}
import { Component, inject } from "@angular/core";
import { Column, TableComponent } from "../../../components/table/table.component";
import { Router } from "@angular/router";

@Component({
    selector: 'app-documents-table',
    template: `
    <app-table tableTitle="Mes documents" [cols]="cols" [data]="data" (selectionChange)="onSelectionChange($event)"></app-table>
    `,
    styleUrls: ['./documents-table.component.scss'],
    imports: [TableComponent],
})
export class DocumentsTableComponent {
    private router: Router = inject(Router);

    public cols: Column[] = [
        { field: 'nom', header: 'Nom', sortable: true },
        { field: 'type', header: 'Type', sortable: true },
        { field: 'flux', header: 'Flux', sortable: true },
        { field: 'status', header: 'Statut', sortable: true },
        { field: 'date', header: 'Date', sortable: true },
    ];

    public data: any[] = [
        { id: '1', nom: 'Document 1', type: 'PDF', flux: 'Entrant', status: 'Validé', date: '2024-01-01' },
        { id: '2', nom: 'Document 2', type: 'Image', flux: 'Sortant', status: 'En attente', date: '2024-02-15' },
        { id: '3', nom: 'Document 3', type: 'PDF', flux: 'Entrant', status: 'Rejeté', date: '2024-03-10' },
        { id: '4', nom: 'Document 4', type: 'Image', flux: 'Sortant', status: 'Validé', date: '2024-04-05' }
    ];

    ngOnInit(): void {
        
    }

    public onSelectionChange(fileSelected: any): void {
        this.router.navigate([`/documents/${fileSelected.id}`]);
    }
}
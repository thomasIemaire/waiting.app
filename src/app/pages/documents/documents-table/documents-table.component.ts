import { Component, inject } from "@angular/core";
import { Column, TableComponent } from "../../../components/table/table.component";
import { Router } from "@angular/router";
import { DocumentsService } from "../../../core/services/documents.service";
import { Utils } from "../../../core/utils/utils";

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
    private documentsService: DocumentsService = inject(DocumentsService);

    public cols: Column[] = [];

    public data: any[] = [];

    ngOnInit(): void {
        this.documentsService.getDocuments().then((documents) => {
            this.cols = [
                { field: 'nom', header: 'Nom', sortable: true },
                { field: 'type', header: 'Type', sortable: true },
                { field: 'status', header: 'Statut', sortable: true },
                { field: 'date', header: 'Date', sortable: true }
            ];
            this.data = documents.map(doc => ({
                id: doc._id,
                type: Utils.toCapitalize(doc.type ?? 'Inconnu'),
                nom: doc.filename,
                status: this.getTagFromStatus(doc.status),
                date: new Date(doc.created_at).toLocaleString()
            }));
        });
    }

    public onSelectionChange(fileSelected: any): void {
        this.router.navigate([`/documents/${fileSelected.id}`]);
    }

    private getTagFromStatus(status?: string): any {
        switch (status) {
            case 'completed':
                return { label: 'Terminé', severity: 'success' };
            case 'processing':
                return { label: 'A envoyer', severity: 'info' };
            case 'incomplete':
                return { label: 'Données manquantes', severity: 'warn' };
            case 'error':
                return { label: 'Erreur', severity: 'danger' };
            default:
                return { label: 'Inconnu', severity: 'secondary' };
        }
    }
}
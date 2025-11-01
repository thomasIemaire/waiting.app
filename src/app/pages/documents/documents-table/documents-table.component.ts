import { Component, inject } from "@angular/core";
import { Column, TableComponent } from "../../../components/table/table.component";
import { Router } from "@angular/router";
import { DocumentsService } from "../../../core/services/documents.service";

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
                { field: 'date', header: 'Date', sortable: true },
            ];
            this.data = documents.map(doc => ({
                id: doc._id,
                nom: doc.filename,
                date: new Date(doc.created_at).toLocaleString()
            }));
        });
    }

    public onSelectionChange(fileSelected: any): void {
        this.router.navigate([`/documents/${fileSelected.id}`]);
    }
}
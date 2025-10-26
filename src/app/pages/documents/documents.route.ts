import { Routes } from '@angular/router';
import { DocumentsComponent } from './documents.component';
import { DocumentsTableComponent } from './documents-table/documents-table.component';
import { PreviewDocumentComponent } from './preview-document/preview-document.component';

export const documentsRoutes: Routes = [
    {
        path: '',
        component: DocumentsComponent,
        title: "Gérez mes documents",
        children: [
            {
                path: '',
                component: DocumentsTableComponent,
                title: "Gérez mes documents"
            },
            {
                path: ':id',
                component: PreviewDocumentComponent,
                title: "Gérez mes documents"
            }
        ]
    }
];

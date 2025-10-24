import { Routes } from '@angular/router';
import { DocumentsComponent } from './documents.component';
import { DocumentsTableComponent } from './documents-table/documents-table.component';
import { PreviewDocumentComponent } from './preview-document/preview-document.component';

export const documentsRoutes: Routes = [
    {
        path: '',
        component: DocumentsComponent,
        title: "Gérez vos documents",
        children: [
            {
                path: '',
                component: DocumentsTableComponent,
                title: "Gérez vos documents"
            },
            {
                path: ':id',
                component: PreviewDocumentComponent,
                title: "Gérez vos documents"
            }
        ]
    }
];

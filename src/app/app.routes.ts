import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'documents',
        loadChildren: () => import('./pages/documents/documents.route').then(m => m.documentsRoutes)
    },
    {
        path: 'contacts',
        loadChildren: () => import('./pages/contacts/contacts.route').then(m => m.contactsRoutes)
    },
    {
        path: 'suppliers',
        loadChildren: () => import('./pages/suppliers/suppliers.route').then(m => m.suppliersRoutes)
    }
];

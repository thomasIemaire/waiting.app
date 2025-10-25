import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'documents',
        loadChildren: () => import('./pages/documents/documents.route').then(m => m.documentsRoutes)
    },
    {
        path: 'customers',
        loadChildren: () => import('./pages/customers/customers.route').then(m => m.customersRoutes)
    },
    {
        path: 'suppliers',
        loadChildren: () => import('./pages/suppliers/suppliers.route').then(m => m.suppliersRoutes)
    }
];

import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./pages/auth/auth.route').then(m => m.authRoutes)
    },
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
    },
    {
        path: 'agents',
        loadChildren: () => import('./pages/agents/agents.route').then(m => m.agentsRoutes)
    },
    {
        path: 'flows',
        loadChildren: () => import('./pages/flows/flows.route').then(m => m.flowsRoutes)
    }
];

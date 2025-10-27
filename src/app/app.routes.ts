import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'documents'
    },
    {
        path: 'auth',
        loadChildren: () => import('./pages/auth/auth.route').then(m => m.authRoutes)
    },
    {
        path: 'documents',
        loadChildren: () => import('./pages/documents/documents.route').then(m => m.documentsRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'customers',
        loadChildren: () => import('./pages/customers/customers.route').then(m => m.customersRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'suppliers',
        loadChildren: () => import('./pages/suppliers/suppliers.route').then(m => m.suppliersRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'agents',
        loadChildren: () => import('./pages/agents/agents.route').then(m => m.agentsRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'flows',
        loadChildren: () => import('./pages/flows/flows.route').then(m => m.flowsRoutes),
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'documents'
    }
];

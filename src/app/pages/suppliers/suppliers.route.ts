import { Routes } from '@angular/router';
import { SuppliersComponent } from './suppliers.component';

export const suppliersRoutes: Routes = [
    {
        path: '',
        component: SuppliersComponent,
        title: "Gérez mes fournisseurs",
    }
];

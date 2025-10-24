import { Routes } from '@angular/router';
import { ContactsComponent } from './contacts.component';

export const contactsRoutes: Routes = [
    {
        path: '',
        component: ContactsComponent,
        title: "Gérez vos contacts",
    }
];

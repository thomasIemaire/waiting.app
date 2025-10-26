import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { SigninComponent } from './signin/signin.component';
import { AuthComponent } from './auth.component';

export const authRoutes: Routes = [
    {
        path: '',
        component: AuthComponent,
        children: [
            {
                path: 'signin',
                component: SigninComponent
            },
            {
                path: 'register',
                component: RegisterComponent
            }
        ]
    }
];

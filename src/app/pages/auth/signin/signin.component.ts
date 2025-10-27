import { Component, inject } from "@angular/core";
import { FormsComponent } from "../../../components/forms/forms.component";
import { ButtonModule } from 'primeng/button';
import { Router } from "@angular/router";

@Component({
    selector: 'app-signin',
    imports: [FormsComponent, ButtonModule],
    template: `
    <div class="signin__wrapper">
        <div class="signin__form">
            <app-forms [form]="formSignin" />
            <div class="signin__actions">
                <p-button label="Se connecter" size="small" class="signin__button"></p-button>
            </div>
        </div>
        <div class="signin__footer">Pas encore de compte ?
            <div class="signin__link" (click)="goToRegister()">Inscrivez-vous</div>
        </div>
    </div>
    `,
    styleUrls: ['./signin.component.scss']
})
export class SigninComponent {
    private router: Router = inject(Router);

    public formSignin = {
        items: [
            {
                type: 'input',
                label: 'Email',
                value: '',
            },
            {
                type: 'password',
                label: 'Mot de passe',
                value: '',
            },
        ]
    };

    public goToRegister(): void {
        this.router.navigate(['/auth/register']);
    }
}
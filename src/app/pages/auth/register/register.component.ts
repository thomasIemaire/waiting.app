import { Component, inject } from "@angular/core";
import { FormsComponent } from "../../../components/forms/forms.component";
import { ButtonModule } from 'primeng/button';
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-register',
    imports: [CommonModule, FormsComponent, ButtonModule],
    template: `
    <div class="register__wrapper">
        <div class="register__form">
            <app-forms [form]="activeForm" />
            <div class="register__actions">
                <p-button text severity="secondary" label="Retour" size="small" (click)="stepper(currentStep - 1)" [disabled]="currentStep === 1"></p-button>
                <p-button label="Suivant" size="small" (click)="stepper(currentStep + 1)" *ngIf="currentStep < 3"></p-button>
                <p-button label="S'inscrire" size="small" *ngIf="currentStep === 3"></p-button>
            </div>
        </div>
        <div class="register__footer">Vous avez déjà un compte ?
            <div class="register__link" (click)="goToSignin()">Connectez-vous</div>
        </div>
    </div>
    `,
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    private router: Router = inject(Router);

    public formRegisterEmail = {
        items: [
            {
                type: 'input',
                label: 'Email',
                value: '',
            }
        ]
    };

    public formRegisterNames = {
        items: [
            {
                type: 'input',
                label: 'Nom',
                value: '',
            },
            {
                type: 'input',
                label: 'Prénom',
                value: '',
            }
        ]
    };

    public formRegisterPassword = {
        items: [
            {
                type: 'password',
                label: 'Mot de passe',
                value: '',
            },
            {
                type: 'password',
                label: 'Confirmer le mot de passe',
                value: '',
            }
        ]
    };

    public activeForm = this.formRegisterEmail;
    public currentStep = 1;

    public stepper(step: number): void {
        this.currentStep = step;
        switch (this.currentStep) {
            case 1:
                this.activeForm = this.formRegisterEmail;
                break;
            case 2:
                this.activeForm = this.formRegisterNames;
                break;
            case 3:
                this.activeForm = this.formRegisterPassword;
                break;
            default:
                this.activeForm = this.formRegisterEmail;
                break;
        }
    }

    public goToSignin(): void {
        this.router.navigate(['/auth/signin']);
    }
}
import { Component, inject } from "@angular/core";
import { FormsComponent } from "../../../components/forms/forms.component";
import { ButtonModule } from 'primeng/button';
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";
import { MessageModule } from "primeng/message";

@Component({
    selector: 'app-register',
    imports: [CommonModule, FormsComponent, ButtonModule, MessageModule],
    template: `
    <div class="register__wrapper">
        <div *ngIf="messages.length" class="register__messages">
            <p-message size="small" *ngFor="let message of messages" [severity]="message.severity">
                {{ message.detail }}
            </p-message>
        </div>
        <div class="register__form">
            <app-forms [form]="activeForm" />
            <div class="register__actions">
                <p-button text severity="secondary" label="Retour" size="small" (click)="stepper(currentStep - 1)" [disabled]="currentStep === 1"></p-button>
                <p-button label="Suivant" size="small" (click)="stepper(currentStep + 1)" *ngIf="currentStep < 3"></p-button>
                <p-button label="S'inscrire" size="small" (click)="onSubmit()" *ngIf="currentStep === 3"></p-button>
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
    private authService: AuthService = inject(AuthService);

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
    public messages: { severity: 'success' | 'info' | 'warn' | 'error'; detail: string }[] = [];

    public stepper(step: number): void {
        this.messages = [];

        const targetStep = Math.min(Math.max(step, 1), 3);

        if (targetStep > this.currentStep) {
            const canProceed = this.validateStep(this.currentStep);
            if (!canProceed) {
                return;
            }
        }

        this.currentStep = targetStep;
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

    public async onSubmit(): Promise<void> {
        this.messages = [];

        if (!this.validateStep(1) || !this.validateStep(2) || !this.validateStep(3)) {
            return;
        }

        const email = this.formRegisterEmail.items[0].value?.trim() ?? '';
        const lastname = this.formRegisterNames.items[0].value?.trim() ?? '';
        const firstname = this.formRegisterNames.items[1].value?.trim() ?? '';
        const password = this.formRegisterPassword.items[0].value ?? '';
        const confirmPassword = this.formRegisterPassword.items[1].value ?? '';

        try {
            await this.authService.register({
                email,
                firstname,
                lastname,
                password,
                confirmPassword
            });
            this.router.navigate(['/documents']);
        } catch (error: any) {
            const detail = error?.message ?? 'Une erreur est survenue lors de la création du compte.';
            this.messages = [{ severity: 'error', detail }];
        }
    }

    private validateStep(step: number): boolean {
        switch (step) {
            case 1: {
                const email = this.formRegisterEmail.items[0].value?.trim() ?? '';
                if (!email) {
                    this.messages = [{ severity: 'error', detail: 'Veuillez saisir un email.' }];
                    return false;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.messages = [{ severity: 'error', detail: 'Veuillez saisir un email valide.' }];
                    return false;
                }
                return true;
            }
            case 2: {
                const lastname = this.formRegisterNames.items[0].value?.trim() ?? '';
                const firstname = this.formRegisterNames.items[1].value?.trim() ?? '';
                if (!lastname || !firstname) {
                    this.messages = [{ severity: 'error', detail: 'Veuillez renseigner votre nom et prénom.' }];
                    return false;
                }
                return true;
            }
            case 3: {
                const password = this.formRegisterPassword.items[0].value ?? '';
                const confirmPassword = this.formRegisterPassword.items[1].value ?? '';
                if (!password || !confirmPassword) {
                    this.messages = [{ severity: 'error', detail: 'Veuillez saisir et confirmer votre mot de passe.' }];
                    return false;
                }

                if (password !== confirmPassword) {
                    this.messages = [{ severity: 'error', detail: 'Les mots de passe ne correspondent pas.' }];
                    return false;
                }
                return true;
            }
            default:
                return true;
        }
    }
}
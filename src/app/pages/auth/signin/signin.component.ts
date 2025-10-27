import { Component, inject } from "@angular/core";
import { FormsComponent } from "../../../components/forms/forms.component";
import { ButtonModule } from 'primeng/button';
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { MessageModule } from "primeng/message";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-signin',
    imports: [CommonModule, FormsComponent, ButtonModule, MessageModule],
    template: `
    <div class="signin__wrapper">
        <div class="signin__form">
            <div *ngIf="messages.length" class="signin__messages">
                <p-message *ngFor="let message of messages" [severity]="message.severity">
                    {{ message.detail }}
                </p-message>
            </div>
            <app-forms [form]="formSignin" />
            <div class="signin__actions">
                <p-button label="Se connecter" size="small" class="signin__button" (click)="onSubmit()"></p-button>
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
    private authService: AuthService = inject(AuthService);

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

    public messages: { severity: 'success' | 'info' | 'warn' | 'error'; detail: string }[] = [];

    public goToRegister(): void {
        this.router.navigate(['/auth/register']);
    }

    public async onSubmit(): Promise<void> {
        this.messages = [];

        const email = this.formSignin.items[0].value?.trim() ?? '';
        const password = this.formSignin.items[1].value ?? '';

        if (!email || !password) {
            this.messages = [{ severity: 'error', detail: 'Veuillez saisir votre email et votre mot de passe.' }];
            return;
        }

        try {
            await this.authService.signin(email, password);
            this.router.navigate(['/documents']);
        } catch (error: any) {
            const detail = error?.message ?? 'Une erreur est survenue lors de la connexion.';
            this.messages = [{ severity: 'error', detail }];
        }
    }
}
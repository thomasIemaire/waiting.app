import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, UserService } from './user.service';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);
    private readonly apiService = inject(ApiService);
    private readonly tokenService = inject(TokenService);

    public async signin(email: string, password: string): Promise<User> {
        const normalizedEmail = email.trim().toLowerCase();

        try {
            const response: any = await firstValueFrom(this.apiService.post('auth/signin', { email: normalizedEmail, password }));
            const { authenticatedUser, token, refreshToken } = this.saveUserAndTokensFromResponse(response);
            return authenticatedUser;
        } catch (err: any) {
            throw new Error(err?.error?.message || 'Identifiant ou mot de passe incorrect');
        }
    }

    public async checkEmailExists(email: string): Promise<boolean> {
        const normalizedEmail = email.trim().toLowerCase();

        try {
           const response: any = await firstValueFrom(this.apiService.get('auth/email-exists', undefined, { email: normalizedEmail }));
            return response.exists;
        } catch {
            return false;
        }
    }

    public async register(payload: { email: string; firstname: string; lastname: string; password: string; confirmPassword: string; }): Promise<User> {
        const email = payload.email.trim().toLowerCase();

        if (payload.password !== payload.confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }

        try {
            const response: any = await firstValueFrom(this.apiService.post('auth/register', {
                email,
                firstname: payload.firstname.trim(),
                lastname: payload.lastname.trim(),
                password: payload.password
            }));
            const { authenticatedUser, token, refreshToken } = this.saveUserAndTokensFromResponse(response);
            return authenticatedUser;
        } catch (err: any) {
            throw new Error(err?.error?.message || 'Une erreur est survenue lors de la création du compte.');
        }
    }

    public async signinWithToken(): Promise<User> {
        const token = this.tokenService.getToken();
        if (!token) {
            throw new Error('No token available');
        }
        try {
            const response: any = await firstValueFrom(this.apiService.post('auth/token', { token }));
            const { authenticatedUser, token: newToken, refreshToken } = this.saveUserAndTokensFromResponse(response);
            return authenticatedUser;
        } catch (err: any) {
            this.signout();
            throw new Error(err?.error?.message || 'Session expirée, veuillez vous reconnecter.');
        }
    }

    private saveUserAndTokensFromResponse(response: any): any {
        const user = response.user;
        const token = response.token;
        const refreshToken = response.refresh_token;

        const authenticatedUser = new User({
            id: user._id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role
        });
        this.userService.setUser(authenticatedUser);
        this.tokenService.setToken(token);
        this.tokenService.setRefreshToken(refreshToken);

        return { authenticatedUser, token, refreshToken };
    }

    public signout(): void {
        this.userService.clearUser();
        this.tokenService.clearTokens();
        this.router.navigate(['/auth/signin']);
    }
}

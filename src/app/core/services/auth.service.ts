import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { users, StoredUser } from '../../../_db/users';
import { User, UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    public async signin(email: string, password: string): Promise<User> {
        const normalizedEmail = email.trim().toLowerCase();
        const match = users.find((user) => user.email.toLowerCase() === normalizedEmail && user.password === password);

        if (!match) {
            throw new Error('Identifiant ou mot de passe incorrect');
        }

        const authenticatedUser = new User({
            id: match.id,
            email: match.email,
            firstname: match.firstname,
            lastname: match.lastname
        });

        this.userService.setUser(authenticatedUser);
        return authenticatedUser;
    }

    public async register(payload: { email: string; firstname: string; lastname: string; password: string; confirmPassword: string; }): Promise<User> {
        const email = payload.email.trim().toLowerCase();

        if (payload.password !== payload.confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }

        const alreadyExists = users.some((user) => user.email.toLowerCase() === email);

        if (alreadyExists) {
            throw new Error('Email déjà existant');
        }

        const newUser: StoredUser = {
            id: this.generateId(),
            email: payload.email.trim(),
            password: payload.password,
            firstname: payload.firstname.trim(),
            lastname: payload.lastname.trim()
        };

        users.push(newUser);

        const registeredUser = new User({
            id: newUser.id,
            email: newUser.email,
            firstname: newUser.firstname,
            lastname: newUser.lastname
        });

        this.userService.setUser(registeredUser);
        return registeredUser;
    }

    public signout(): void {
        this.userService.clearUser();
        this.router.navigate(['/auth/signin']);
    }

    private generateId(): string {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }

        return Math.random().toString(36).substring(2, 10);
    }
}

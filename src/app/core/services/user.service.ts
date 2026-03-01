import { inject, Injectable } from '@angular/core';
import { Behavior } from '../utils/behavior';
import { StorageService } from './storage.service';
import { Utils } from '../utils/utils';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export class User {
    id?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    role?: string;

    constructor(init?: Partial<User>) {
        Object.assign(this, init);
    }

    getFullname(): string {
        const firstname = Utils.toCapitalize(this.firstname || '');
        const lastname = Utils.toCapitalize(this.lastname || '');
        return `${firstname} ${lastname}`.trim();
    }

    isAdmin(): boolean {
        return this.role === 'admin';
    }
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly USER_STORAGE_KEY = 'app-user';

    public user: Behavior<User | null> = new Behavior<User | null>(null);

    private storageService: StorageService = inject(StorageService);
    private apiService: ApiService = inject(ApiService);

    constructor() {
        this.storageService.getAndSetItem(this.USER_STORAGE_KEY, (user: User | null) => {
            if (user) {
                this.setUser(new User(user));
            }
        });
    }

    public setUser(user: User | null): void {
        this.user.set(user);
        this.storageService.setItem(this.USER_STORAGE_KEY, user);
    }

    public getUser(): User | null {
        return this.user.value;
    }

    public clearUser(): void {
        this.user.set(null);
        this.storageService.setItem(this.USER_STORAGE_KEY, null);
    }

    public restoreUserData(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await firstValueFrom(this.apiService.delete('users/me'));
                resolve();
            } catch (error) {
                console.error('Error restoring user data:', error);
                reject(error);
            }
        });
    }

    public getAvatarUrl(userId: string): string {
        return `${this.apiService.publicUrl}/avatars/${userId}.png`;
    }
}
import { inject, Injectable } from '@angular/core';
import { Behavior } from '../utils/behavior';
import { StorageService } from './storage.service';

export class User {
    id?: string;
    email?: string;
    firstname?: string;
    lastname?: string;

    constructor(init?: Partial<User>) {
        Object.assign(this, init);
    }

    getFullname(): string {
        return `${this.firstname || ''} ${this.lastname || ''}`.trim();
    }
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly DEFAULT_USER: any = {
        id: 'default-user-id',
        email: 'john.doe@example.com',
        firstname: 'John',
        lastname: 'Doe'
    };

    private readonly USER_STORAGE_KEY = 'app-user';

    public user: Behavior<User | null> = new Behavior<User | null>(null);

    private storageService: StorageService = inject(StorageService);

    constructor() {
        this.storageService.getAndSetItem(this.USER_STORAGE_KEY, (user: User | null) => {
            this.setUser(new User(user || this.DEFAULT_USER));
        });
    }

    public setUser(user: User | null): void {
        this.user.set(user);
        this.storageService.setItem(this.USER_STORAGE_KEY, user);
    }

    public clearUser(): void {
        this.user.set(null);
        this.storageService.setItem(this.USER_STORAGE_KEY, null);
    }
}
import { inject, Injectable } from "@angular/core";
import { Behavior } from "../utils/behavior";
import { StorageService } from "./storage.service";

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    private readonly TOKEN_STORAGE_KEY: string = 'auth_token';

    public token: Behavior<string | null> = new Behavior<string | null>(null);

    private storageService: StorageService = inject(StorageService);

    constructor() {
        this.storageService.getAndSetItem(this.TOKEN_STORAGE_KEY, (v: string | null) => {
            this.token.set(v);
        });
    }

    public setToken(token: string | null): void {
        this.token.set(token);
        this.storageService.setItem(this.TOKEN_STORAGE_KEY, token);
    }

    public getToken(): string | null {
        return this.token.value;
    }

}
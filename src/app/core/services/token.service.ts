import { inject, Injectable } from "@angular/core";
import { Behavior } from "../utils/behavior";
import { StorageService } from "./storage.service";

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    private readonly TOKEN_STORAGE_KEY: string = 'auth_token';
    private readonly REFRESH_TOKEN_STORAGE_KEY: string = 'auth_refresh_token';

    public token: Behavior<string | null> = new Behavior<string | null>(null);
    public refreshToken: Behavior<string | null> = new Behavior<string | null>(null);

    private storageService: StorageService = inject(StorageService);

    constructor() {
        this.storageService.getAndSetItem(this.TOKEN_STORAGE_KEY, (v: string | null) => {
            this.token.set(v);
        });
        this.storageService.getAndSetItem(this.REFRESH_TOKEN_STORAGE_KEY, (v: string | null) => {
            this.refreshToken.set(v);
        });
    }

    public setToken(token: string | null): void {
        this.token.set(token);
        this.storageService.setItem(this.TOKEN_STORAGE_KEY, token);
    }

    public setRefreshToken(refreshToken: string | null): void {
        this.refreshToken.set(refreshToken);
        this.storageService.setItem(this.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }

    public getToken(): string | null {
        return this.token.value;
    }

    public getRefreshToken(): string | null {
        return this.refreshToken.value;
    }

    public clearTokens(): void {
        this.setToken(null);
        this.setRefreshToken(null);
    }
}
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    public setItem(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    public getItem(key: string): any {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    public getAndSetItem(key: string, fn: (v: any) => any): void {
        const item = this.getItem(key);
        fn(item);
    }

    public removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    public clear(): void {
        localStorage.clear();
    }
}
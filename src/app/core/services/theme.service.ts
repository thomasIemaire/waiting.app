import { inject, Injectable } from "@angular/core";
import { Behavior } from "../utils/behavior";
import { StorageService } from "./storage.service";

type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_STORAGE_KEY = 'app-theme';
    private readonly DEFAULT_THEME: Theme = 'light';

    public theme: Behavior<Theme> = new Behavior<Theme>(this.DEFAULT_THEME);

    private storageService: StorageService = inject(StorageService);

    constructor() {
        this.storageService.getAndSetItem(this.THEME_STORAGE_KEY, (v: Theme) => {
            this.setTheme(v || this.DEFAULT_THEME);
        });

        this.theme.value$.subscribe((theme: Theme) => {
            document.documentElement.classList.remove('app-light', 'app-dark');
            document.documentElement.classList.add(`app-${theme}`);
        });
    }

    public setTheme(theme: Theme): void {
        this.theme.set(theme);
        this.storageService.setItem(this.THEME_STORAGE_KEY, theme);
    }

    public getTheme(): Theme {
        return this.theme.value;
    }

    public isDarkMode(): boolean {
        return this.getTheme() === 'dark';
    }

    public toggleTheme(): void {
        const newTheme: Theme = this.isDarkMode() ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

}
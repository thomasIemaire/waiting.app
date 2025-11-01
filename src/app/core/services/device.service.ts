import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class DeviceService {

    public screenWidth: number = window.innerWidth;

    constructor() {
        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
        });
    }

    get isDesktopSize(): boolean {
        return this.screenWidth >= 1024;
    }

    get isTabletSize(): boolean {
        return this.screenWidth >= 768 && this.screenWidth < 1024;
    }

   get isMobileSize(): boolean {
        return this.screenWidth < 768;
    }

    get isMobile(): boolean {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        return /android|iphone|ipad|ipod|windows phone/i.test(userAgent.toLowerCase());
    }
}
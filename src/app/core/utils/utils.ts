export class Utils {
    static delay(ms: number) {
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }

    static truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.slice(0, maxLength) + '...';
    }

    static toCapitalize(text: string): string {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
}
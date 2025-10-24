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
}
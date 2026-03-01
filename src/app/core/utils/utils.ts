import { v4 as uuidv4 } from 'uuid';

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

    static generateUUID(): string {
        return uuidv4().replace(/-/g, '');
    }

    static _id2id(object: any): any {
        if (Array.isArray(object)) {
            return object.map(item => this._id2id(item));
        } else if (object !== null && typeof object === 'object') {
            const newObj: any = {};
            for (const key in object) {
                if (key === '_id') {
                    newObj['id'] = object[key];
                } else {
                    newObj[key] = this._id2id(object[key]);
                }
            }
            return newObj;
        }
        return object;
    }
}
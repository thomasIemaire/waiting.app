import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'truncateText',
    standalone: true,
    pure: true
})
export class TruncateTextPipe implements PipeTransform {

    private sliceByCodePoints(text: string, count: number): string {
        return Array.from(text).slice(0, Math.max(0, count)).join('');
    }

    transform(
        value: unknown,
        max = 20,
        ellipsis = '…'
    ): string {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (max <= 0) return '';
        if (Array.from(str).length <= max) return str;

        const ellLen = Array.from(ellipsis).length;
        const take = Math.max(0, max - ellLen);
        const head = this.sliceByCodePoints(str, take).trimEnd();
        return head + ellipsis;
    }
}

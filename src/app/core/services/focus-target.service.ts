import { Injectable } from '@angular/core';

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

@Injectable({ providedIn: 'root' })
export class FocusTargetService {
    private lastFocused: TextInputElement | null = null;

    setLastFocused(el: EventTarget | null): void {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            this.lastFocused = el;
        }
    }

    getLastFocused(): TextInputElement | null {
        return this.lastFocused;
    }

    insertTextAtCursor(text: string): void {
        if (!this.lastFocused) {
            return;
        }

        const el = this.lastFocused;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;

        const before = el.value.substring(0, start);
        const after = el.value.substring(end);

        el.value = before + text + after;

        const newPos = start + text.length;
        el.selectionStart = el.selectionEnd = newPos;

        el.focus();
    }
}
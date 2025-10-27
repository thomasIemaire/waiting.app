import { Injectable } from '@angular/core';

export interface DragPayload {
    providerId: string;
    fromSection: string;
    record: any;
    removeFromSource: () => void;
    copyOnExternalDrop?: boolean;
}

@Injectable({ providedIn: 'root' })
export class KanbanDragService {
    private payload?: DragPayload;

    start(p: DragPayload) { this.payload = p; }
    peek(): DragPayload | undefined { return this.payload; }
    consume(): DragPayload | undefined {
        const p = this.payload;
        this.payload = undefined;
        return p;
    }
    clear() { this.payload = undefined; }
}

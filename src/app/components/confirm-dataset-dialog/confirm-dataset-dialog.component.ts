import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

type Entity = { key: string; start: number; end: number };
type Node = { key?: string; children: Array<string | Node> };

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DynamicDialogModule, TooltipModule],
    template: `
    <div>
        <div class="dialog-content">
            <div class="example-line" *ngFor="let line of tokens">
                <ng-container *ngFor="let node of line">
                    <ng-container *ngTemplateOutlet="renderNode; context:{ n: node }"></ng-container>
                </ng-container>
            </div>

            <ng-template #renderNode let-n="n">
                <!-- nœud avec entité -->
                <ng-container *ngIf="n.key; else renderChildren">
                    <span class="entity-in-example" [pTooltip]="n.key" tooltipPosition="top">
                    <ng-container *ngFor="let c of n.children">
                        <span *ngIf="isString(c); else childNode" class="plain" [textContent]="c"></span>
                        <ng-template #childNode>
                        <ng-container *ngTemplateOutlet="renderNode; context:{ n: c }"></ng-container>
                        </ng-template>
                    </ng-container>
                    </span>
                </ng-container>

                <!-- nœud sans entité -->
                <ng-template #renderChildren>
                    <ng-container *ngFor="let c of n.children">
                    <span *ngIf="isString(c); else childNode2" class="plain" [textContent]="c"></span>
                    <ng-template #childNode2>
                        <ng-container *ngTemplateOutlet="renderNode; context:{ n: c }"></ng-container>
                    </ng-template>
                    </ng-container>
                </ng-template>
            </ng-template>
        </div>

        <div class="dialog-footer">
            <div>
                <p-button text severity="secondary" label="Actualiser" size="small" (click)="reload()"></p-button>
            </div>
            <div>
                <p-button text severity="secondary" label="Annuler" size="small" (click)="ref.close(false)"></p-button>
                <p-button label="Valider" size="small" (click)="ref.close(true)"></p-button>
            </div>
        </div>
    </div>
  `,
    styles: [`
    .dialog-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .example-line {
            width: 100%;
            display:flex;
            align-items:center;
            flex-wrap:wrap;
            gap: 0;
            user-select: none;
            font-size: 0.875rem;
            
            .entity-in-example {
                background-color: var(--background-color-200);
                border: 1px solid var(--background-color-300);
                padding: .1rem .4rem;
                border-radius: .3rem;
                font-size: .75rem;
                font-weight: 600;
                margin: 0 .125rem;
                white-space: pre-wrap;
                cursor: pointer;
            }

            .plain {
                white-space: pre-wrap;
            }
        }
    }

    .dialog-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        div {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 1rem;
        }
    }
    `]
})
export class ConfirmDatasetDialogComponent {
    constructor(public ref: DynamicDialogRef, public cfg: DynamicDialogConfig) { }

    tokens: Node[][] = [];

    ngOnInit() {
        this.reload();
    }

    reload() {
        this.cfg.data?.examples().subscribe({
            next: (res: any[]) => {
                this.tokens = [];
                for (const ex of res || []) {
                    this.tokens.push(this.buildTokens(ex?.text ?? '', ex?.entities ?? []));
                }
            }
        });
    }

    isString(v: any): v is string { return typeof v === 'string'; }

    buildTokens(text: string, entities: Entity[]): Node[] {
        const len = text?.length ?? 0;
        const root: Node = { children: [] };
        if (!len) return [root];

        // normalisation + événements (identique à avant)
        type Ev = { pos: number; type: 'start' | 'end'; key: string; L: number };
        const norm = entities
            .map(e => {
                let s = Math.max(0, Math.min(len, e.start ?? 0));
                let t = Math.max(0, Math.min(len, e.end ?? 0));
                if (t < s) [s, t] = [t, s];
                return { key: e.key, start: s, end: t, L: t - s };
            })
            .filter(e => e.L > 0);

        const evs: Ev[] = [];
        for (const e of norm) {
            evs.push({ pos: e.start, type: 'start', key: e.key, L: e.L });
            evs.push({ pos: e.end, type: 'end', key: e.key, L: e.L });
        }
        evs.sort((a, b) =>
            a.pos - b.pos ||
            (a.type === 'end' && b.type === 'start' ? -1 : a.type === 'start' && b.type === 'end' ? 1 :
                a.type === 'start' ? b.L - a.L : a.L - b.L)
        );

        // construction de l'arbre
        const stack: Node[] = [root];
        let cursor = 0, i = 0;

        while (i < evs.length) {
            const p = evs[i].pos;
            if (p > cursor) {
                stack[stack.length - 1].children.push(text.slice(cursor, p));
                cursor = p;
            }
            const ends: Ev[] = [], starts: Ev[] = [];
            while (i < evs.length && evs[i].pos === p) {
                (evs[i].type === 'end' ? ends : starts).push(evs[i]); i++;
            }
            for (const e of ends.sort((a, b) => a.L - b.L)) stack.pop();
            for (const e of starts.sort((a, b) => b.L - a.L)) {
                const parent = stack[stack.length - 1];
                const node: Node = { key: e.key, children: [] };
                parent.children.push(node);
                stack.push(node);
            }
        }

        if (cursor < len) stack[stack.length - 1].children.push(text.slice(cursor));

        // ⬅️ Retourne toujours un seul nœud racine
        return [root];
    }
}

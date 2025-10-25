import { Component } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-save-footer',
    standalone: true,
    imports: [ButtonModule],
    template: `
    <div class="save-footer__wrapper">
        <p-button variant="text" severity="secondary" size="small" label="Annuler" (click)="closeDialog({ result: false, summary: 'Client Annulé' })" />
        <p-button severity="primary" size="small" label="Enregistrer" (click)="closeDialog({ result: true, summary: 'Client Enregistré' })"/>
    </div>
    `,
    styles: `
    .save-footer__wrapper {
        display: flex;
        justify-content: flex-end;
        gap: var(--gap-s);
    }
    `
})
export class SaveFooterComponent {
    constructor(public ref: DynamicDialogRef) { }

    closeDialog(data: any) {
        this.ref.close(data);
    }
}
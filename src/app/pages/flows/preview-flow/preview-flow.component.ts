import { Component, inject, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // Important
import { Observable } from "rxjs";

import { GflowComponent } from "../../../components/gflow/gflow.component";
import { ApiService } from "../../../core/services/api.service";
import { ComponentCanDeactivate } from "../../../core/guards/pending-changes.guard"; // Import de l'interface

@Component({
    selector: 'app-preview-flow',
    standalone: true,
    imports: [CommonModule, GflowComponent, ToastModule, ConfirmDialogModule],
    templateUrl: './preview-flow.component.html',
    styleUrls: ['./preview-flow.component.scss'],
    providers: [MessageService, ConfirmationService] // Ajout du ConfirmationService ici
})
export class PreviewFlowComponent implements ComponentCanDeactivate {

    private apiService = inject(ApiService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    @ViewChild(GflowComponent) gflowComponent!: GflowComponent;

    // Implémentation du Guard
    canDeactivate(): boolean | Observable<boolean> {
        // Si le composant Gflow n'est pas chargé ou n'est pas "sale", on autorise
        if (!this.gflowComponent || !this.gflowComponent.isDirty) {
            return true;
        }

        // Sinon, on demande confirmation via PrimeNG
        return new Observable<boolean>((observer) => {
            this.confirmationService.confirm({
                header: 'Modifications non enregistrées',
                message: 'Vous avez des modifications en cours. Êtes-vous sûr de vouloir quitter sans enregistrer ?',
                acceptLabel: 'Quitter sans sauvegarder',
                rejectLabel: 'Annuler',
                acceptButtonProps: { size: "small", severity: "danger", text: true },
                rejectButtonProps: { size: "small", severity: "secondary", text: true },
                accept: () => {
                    observer.next(true);
                    observer.complete();
                },
                reject: () => {
                    observer.next(false);
                    observer.complete();
                }
            });
        });
    }

    public onSaveFlow(payload: any): void {
        return;
        // La logique est gérée directement dans GflowComponent pour l'instant
    }
}
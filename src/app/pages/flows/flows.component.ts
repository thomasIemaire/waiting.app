import { Component, OnInit, ViewChild, inject } from "@angular/core";
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { Router, RouterOutlet } from "@angular/router";
import { MenuItem, MessageService } from "primeng/api";
import { ListFlowItemComponent } from "../../components/list-flow-item/list-flow-item.component";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";
import { ApiService } from "../../core/services/api.service";
import { ContextMenu, ContextMenuModule } from "primeng/contextmenu";

export interface Flow {
    id: string;
    name: string;
    description: string;
    default?: boolean; // Ajout du type
    created_at: string | Date;
    created_by: {
        id: string;
        firstname: string;
        lastname: string;
    };
}

@Component({
    selector: 'app-flows',
    imports: [CommonModule, FormsModule, ContextMenuModule, ToastModule, RouterOutlet, ListFlowItemComponent, InputTextModule, MultiSelectModule, ButtonModule, SelectModule],
    template: `
    <p-contextmenu #cardMenu [model]="cardMenuItems"></p-contextmenu>
    <p-toast />
    <div class="flows__wrapper">
        <div class="flows-search__wrapper">
            <input pInputText [(ngModel)]="search" type="text" pSize="small" placeholder="Rechercher" fluid />
            <p-multiselect
                [options]="cols"
                [(ngModel)]="searchOnlyCols"
                optionLabel="field"
                size="small"
                placeholder="Rechercher sur les champs"
                [showHeader]="false"
                selectedItemsLabel="{0} champs sélectionnés" />
            <span class="mx-2">Trier sur</span>
            <p-select
                size="small"
                [options]="cols"
                [(ngModel)]="filterOnCol"
                optionLabel="field"
                placeholder="Selectionner un champ" />
            <p-button
                text severity="secondary" type="button"
                [icon]="sortOrder === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
                size="small"
                (click)="sortOrder = -sortOrder">
            </p-button>
        </div>

        <div class="list-flows">
            <div class="add-flow" (click)="createFlow()">
                <i class="pi pi-plus"></i>
            </div>
            
            <app-list-flow-item 
                *ngFor="let flow of flows" 
                [flow]="flow" 
                (click)="openFlow(flow.id)"
                (contextMenu)="onContextMenu($event, flow)" />
            
            <div *ngIf="flows.length === 0" class="no-data">
                Aucun flux trouvé.
            </div>
        </div>

        <div class="router-outlet__wrapper" [class.active]="hasActiveRoute">
            <router-outlet 
                (activate)="onActivate()" 
                (deactivate)="onDeactivate()" />
        </div>
    </div>
    `,
    styleUrls: ['./flows.component.scss'],
    providers: [MessageService]
})
export class FlowsComponent implements OnInit {
    private router: Router = inject(Router);
    private apiService: ApiService = inject(ApiService);
    private messageService: MessageService = inject(MessageService);

    public hasActiveRoute = false;

    public cols = [
        { field: 'name', header: 'Nom' },
        { field: 'description', header: 'Description' },
        { field: 'created_by.firstname', header: 'Créé par' },
        { field: 'created_at', header: 'Date de création' },
    ];

    public search: string = '';
    public searchOnlyCols: any[] = [];
    public filterOnCol: any = null;
    public sortOrder: number = 1;

    public flows: Flow[] = [];

    // Flux actuellement ciblé par le clic droit
    private selectedFlow: Flow | null = null;

    @ViewChild('cardMenu') cardMenu!: ContextMenu;

    public cardMenuItems: MenuItem[] = [
        {
            label: 'Définir comme défaut',
            icon: 'pi pi-check-circle',
            command: () => this.setDefaultFlow()
        },
        {
            label: 'Supprimer',
            icon: 'pi pi-trash',
            styleClass: 'text-red-500', // Optionnel pour le style
            command: () => this.deleteFlow()
        }
    ];

    ngOnInit(): void {
        this.loadFlows();
    }

    public loadFlows(): void {
        this.apiService.get<Flow[]>('flows/').subscribe({
            next: (data: any) => {
                this.flows = data;
            },
            error: (err: any) => {
                console.error('Erreur lors du chargement des flows', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les flux.'
                });
            }
        });
    }

    public createFlow(): void {
        this.router.navigate(['/flows/new']);
    }

    public openFlow(flowId: string): void {
        this.router.navigate([`/flows/${flowId}`]);
    }

    // Gestion du clic droit
    public onContextMenu(event: MouseEvent, flow: Flow): void {
        this.selectedFlow = flow;
        this.cardMenu.show(event);
    }

    // Action : Définir par défaut
    private setDefaultFlow(): void {
        if (!this.selectedFlow) return;

        this.apiService.post(`flows/${this.selectedFlow.id}/default`, {}).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Flux défini par défaut.' });
                this.loadFlows(); // Recharger pour voir la mise à jour (l'icône orange)
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de définir le flux par défaut.' });
            }
        });
    }

    // Action : Supprimer
    private deleteFlow(): void {
        if (!this.selectedFlow) return;

        // Note: Idéalement ajouter une confirmation ici (ConfirmationService)
        this.apiService.delete(`flows/${this.selectedFlow.id}`).subscribe({
            next: () => {
                this.messageService.add({ severity: 'info', summary: 'Supprimé', detail: 'Le flux a été supprimé.' });
                this.loadFlows();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer le flux.' });
            }
        });
    }

    onActivate() {
        this.hasActiveRoute = true;
    }

    onDeactivate() {
        this.hasActiveRoute = false;
        this.loadFlows();
    }
}
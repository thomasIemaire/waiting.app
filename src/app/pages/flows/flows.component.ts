import { Component, OnInit, inject } from "@angular/core"; // Ajout de OnInit
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { Router, RouterOutlet } from "@angular/router";
import { MessageService } from "primeng/api";
import { ListFlowItemComponent } from "../../components/list-flow-item/list-flow-item.component";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";
import { ApiService } from "../../core/services/api.service";

// Définition de l'interface pour correspondre à votre Backend Python
export interface Flow {
    id: string; // MongoDB renvoie des string pour les ID
    name: string;
    description: string;
    created_at: string | Date;
    created_by: {
        id: string;
        firstname: string;
        lastname: string;
    };
    // data?: any; // Optionnel si vous ne l'affichez pas dans la liste
}

@Component({
    selector: 'app-flows',
    imports: [CommonModule, FormsModule, ToastModule, RouterOutlet, ListFlowItemComponent, InputTextModule, MultiSelectModule, ButtonModule, SelectModule],
    template: `
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
        
            <app-list-flow-item *ngFor="let flow of flows" [flow]="flow" (click)="openFlow(flow.id)" />
            
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
    private apiService: ApiService = inject(ApiService); // Injection du service API
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

    // Initialisé à vide, sera rempli par l'API
    public flows: Flow[] = [];

    ngOnInit(): void {
        this.loadFlows();
    }

    /**
     * Charge la liste des flows depuis le backend
     */
    public loadFlows(): void {
        // 'flows' correspond à la fin de l'URL car ApiService ajoute déjà base + '/api'
        // Si votre routeur Python est 'models/flows', mettez 'models/flows' ici.
        // Si vous avez enregistré le blueprint avec url_prefix='/api/flows', mettez juste 'flows' ici.
        // Basé sur votre structure Python précédente, c'était 'models/flows', 
        // mais si l'URL finale est .../api/flows, alors :

        this.apiService.get<Flow[]>('flows/').subscribe({
            next: (data: any) => {
                this.flows = data;
                console.log('Flows chargés:', this.flows);
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

    onActivate() {
        this.hasActiveRoute = true;
        // Optionnel : Recharger la liste quand on revient de la vue détail/édition
        // this.loadFlows(); 
    }

    onDeactivate() {
        this.hasActiveRoute = false;
        // Recharger la liste quand on ferme une route enfant (ex: après une création)
        this.loadFlows();
    }
}
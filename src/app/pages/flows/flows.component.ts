import { Component, inject } from "@angular/core";
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
export class FlowsComponent {
    private router: Router = inject(Router);
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

    public flows = [
        {
            id: 1,
            name: 'Flux 1',
            description: 'Description du flux 1',
            created_by: {
                id: '6900ca440de85ad6173e53f7',
                firstname: 'Thomas',
                lastname: 'Lemaire'
            },
            created_at: new Date()
        },
        {
            id: 2,
            name: 'Flux 2',
            description: 'Description du flux 2',
            created_by: {
                id: '6900ca440de85ad6173e53f7',
                firstname: 'Thomas',
                lastname: 'Lemaire'
            },
            created_at: new Date()
        },
    ];

    public createFlow(): void {
        this.router.navigate(['/flows/new']);
    }

    public openFlow(flowId: number): void {
        this.router.navigate([`/flows/${flowId}`]);
    }

    onActivate() {
        this.hasActiveRoute = true;
    }

    onDeactivate() {
        this.hasActiveRoute = false;
    }
}
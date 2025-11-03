import { Component, inject } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

import { KanbanComponent } from "../../components/kanban/kanban.component";
import { KanbanItem } from "../../components/kanban/kanban-item/kanban-item.component";
import { Column } from "../../components/table/table.component";
import { KanbanAgentItemComponent } from "../../components/kanban-agent-item/kanban-agent-item.component";
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from "@angular/router";

import { filter, switchMap, of } from "rxjs";
import { Utils } from "../../core/utils/utils";

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, ToastModule, KanbanComponent],
  template: `
    <p-toast />
    <div class="agents__wrapper">
      <app-kanban [items]="kanbanAgents" [cols]="kanbanAgentsCols" [activeItem]="activeKanbanItem" [isAnyTabActive]="isAnyTabActive">
        <div class="agents__router-outlet" *ngIf="isAnyTabActive">
          <router-outlet></router-outlet>
        </div>
      </app-kanban>
    </div>
  `,
  styleUrls: ['./agents.component.scss'],
  providers: [MessageService]
})
export class AgentsComponent {
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

  public kanbanAgents: KanbanItem[] = [
    {
      id: 'models',
      name: 'Modèles',
      copyOnExternalDrop: true,
      sections: [
        {
          name: 'Prêts',
          endpoint: '/api/agents/models/in-progress',
          component: KanbanAgentItemComponent,
          draggable: true,
          add: () => {
            this.router.navigate([`/agents/${Utils.generateUUID()}`]);
            this.setActiveTab([0]);
          },
          click: (item: KanbanItem) => {
            this.router.navigate([`/agents/${item.id}`]);
            this.setActiveTab([0]);
          }
        },
      ]
    },
    {
      id: 'datasets',
      name: 'Datasets',
      dropable: {
        enabled: true,
        acceptedFrom: ['models']
      },
      sections: [
        {
          name: 'A valider',
          endpoint: '/api/agents/prepared/to-prepare',
          component: KanbanAgentItemComponent
        },
        {
          name: 'En cours',
          endpoint: '/api/agents/prepared/in-progress',
          component: KanbanAgentItemComponent,
          draggable: false
        },
        {
          name: 'En attente',
          endpoint: '/api/agents/prepared/to-train',
          component: KanbanAgentItemComponent,
          draggable: false
        },
      ]
    },
    {
      id: 'trains',
      name: 'Entraînement',
      dropable: {
        enabled: true,
        acceptedFrom: ['datasets']
      },
      sections: [
        {
          name: 'En cours',
          endpoint: '/api/agents/trains/in-progress',
          component: KanbanAgentItemComponent,
          draggable: false
        },
        {
          name: 'En attente',
          endpoint: '/api/agents/trains/to-deploy',
          component: KanbanAgentItemComponent,
          draggable: false
        },
      ]
    },
    {
      id: 'agents',
      name: 'Agents',
      sections: [
        {
          name: 'Déployés',
          endpoint: '/api/agents/deployed/active',
          component: KanbanAgentItemComponent,
          draggable: false
        },
      ]
    }
  ];

  public readonly DEFAULT_ACTIVE_KANBAN_ITEM = [0, 1, 2, 3];
  public activeKanbanItem!: number[];

  ngOnInit(): void {
    const child = this.route.firstChild;
    const agentId = child?.snapshot.paramMap.get('id');

    if (agentId) this.setActiveTab([0]);
    else this.setActiveTab(this.DEFAULT_ACTIVE_KANBAN_ITEM);

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        switchMap(() => this.route.firstChild ? this.route.firstChild.paramMap : of(null))
      )
      .subscribe(params => {
        const agentId = params?.get('id');
        if (agentId) this.setActiveTab([0]);
        else this.setActiveTab(this.DEFAULT_ACTIVE_KANBAN_ITEM);
      });
  }

  setActiveTab(index: number[]): void {
    this.activeKanbanItem = index;
  }

  get isAnyTabActive(): boolean {
    return !!this.activeKanbanItem
      && this.activeKanbanItem.length !== this.DEFAULT_ACTIVE_KANBAN_ITEM.length;
  }

  public kanbanAgentsCols: Column[] = [
    { field: 'nom', header: 'Nom' },
    { field: 'reference', header: 'Référence' },
    { field: 'statut', header: 'Statut' },
    { field: 'date', header: 'Date' },
    { field: 'version', header: 'Version' },
  ];
}

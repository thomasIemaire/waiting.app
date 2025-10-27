import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

import { KanbanComponent } from "../../components/kanban/kanban.component";
import { KanbanItem } from "../../components/kanban/kanban-item/kanban-item.component";
import { Column } from "../../components/table/table.component";
import { KanbanAgentItemComponent } from "../../components/kanban-agent-item/kanban-agent-item.component";

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, KanbanComponent],
  template: `
    <p-toast />
    <div class="agents__wrapper">
      <app-kanban [items]="kanbanAgents" [cols]="kanbanAgentsCols" />
    </div>
  `,
  styleUrls: ['./agents.component.scss'],
  providers: [MessageService]
})
export class AgentsComponent {
  public kanbanAgents: KanbanItem[] = [
    {
      id: 'models',
      name: 'Modèles',
      copyOnExternalDrop: true,
      sections: [
        {
          name: 'Prêts',
          endpoint: '/api/agents/models/in-progress',
          add: true, component: KanbanAgentItemComponent,
          draggable: true
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

  public kanbanAgentsCols: Column[] = [
    { field: 'nom', header: 'Nom' },
    { field: 'reference', header: 'Référence' },
    { field: 'statut', header: 'Statut' },
    { field: 'date', header: 'Date' },
    { field: 'version', header: 'Version' },
  ];
}

import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";

import { KanbanComponent } from "../../components/kanban/kanban.component";
import { KanbanItem } from "../../components/kanban/kanban-item/kanban-item.component";

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, KanbanComponent],
  template: `
    <p-toast />
    <div class="agents__wrapper">
      <app-kanban [items]="kanbanAgents" />
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
      sections: [
        { name: 'Prêts', endpoint: '/api/agents/models/in-progress', add: true },
      ]
    },
    {
      id: 'datasets',
      name: 'Datasets',
      sections: [
        { name: 'En cours', endpoint: '/api/agents/prepared/to-prepare' },
        { name: 'En attente', endpoint: '/api/agents/prepared/to-train' },
      ]
    },
    {
      id: 'trains',
      name: 'Entraînement',
      sections: [
        { name: 'En cours', endpoint: '/api/agents/trains/in-progress' },
        { name: 'En attente', endpoint: '/api/agents/trains/to-deploy' },
      ]
    },
    {
      id: 'agents',
      name: 'Agents',
      sections: [
        { name: 'Déployés', endpoint: '/api/agents/deployed/active' },
      ]
    }
  ];
}

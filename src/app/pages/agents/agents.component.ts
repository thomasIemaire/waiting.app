import { Component, inject, ViewChild } from "@angular/core";
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
import { ModelsEventsService } from "../../core/services/models-events.service";
import { Form } from "../../components/forms/forms.component";
import { ConfirmDatasetDialogComponent } from "../../components/confirm-dataset-dialog/confirm-dataset-dialog.component";
import { ApiService } from "../../core/services/api.service";

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
  private modelsEvents = inject(ModelsEventsService);
  private api = inject(ApiService);

  @ViewChild(KanbanComponent) kanban!: KanbanComponent;

  // ... (votre formulaire datasetSizeForm reste identique)
  private datasetSizeForm: Form = { /* ... conservez votre configuration ... */
    items: [
      { type: 'select', label: 'Taille du dataset', key: 'dataset_size', value: 1000, required: true, editable: true, options: [{ label: 'Petit', value: 100 }, { label: 'Moyen', value: 1000 }, { label: 'Grand', value: 10000 }] },
      { type: 'number', tooltip: "Ratio du bruit", label: "Ratio du dataset négatif", key: 'negative_ratio', value: 0.4, required: false, mask: /^0(\.\d+)?|1(\.0+)?$/ },
      { type: 'number', tooltip: "Ratio d'évaluation", label: "Ratio d'évaluation", key: 'eval_ratio', value: 0.2, required: true, mask: /^0(\.\d+)?|1(\.0+)?$/ },
      { type: 'number', tooltip: 'Nombre d\'époques pour l\'entraînement du modèle', label: 'Époques', key: 'epochs', value: 5, required: true, mask: /^[0-9]+$/ },
      { type: 'select', tooltip: 'Plus le batch size est élevé, plus le traitement est rapide mais nécessite plus de mémoire', label: 'Batch Size', key: 'batch_size', value: 16, required: true, options: [{ label: '4', value: 4 }, { label: '8', value: 8 }, { label: '16', value: 16 }, { label: '32', value: 32 }] },
      { type: 'select', tooltip: 'Plus le taux d\'apprentissage est élevé, plus le modèle apprend rapidement mais peut devenir instable', label: 'Learning Rate', key: 'learning_rate', value: 5e-5, editable: true, required: true, options: [{ label: '4e-1', value: 4e-1 }, { label: '5e-5', value: 5e-5 }, { label: '5e-6', value: 5e-6 }] },
      { type: 'select', tooltip: 'Modèle pré-entraîné utilisé comme base pour l\'entraînement', label: 'Modèle de base', key: 'base_model', value: 'cmarkea/distilcamembert-base', required: true,
        options: [
          { label: 'distilcamembert-base', value: 'cmarkea/distilcamembert-base' },
          { label: 'camembert-base', value: 'camembert/camembert-base' },
          { label: 'camembert-large', value: 'camembert/camembert-large' }
        ]
      },
    ]
  };

  public kanbanAgents: KanbanItem[] = [
    {
      id: 'models',
      name: 'Modèles',
      copyOnExternalDrop: true,
      onRemoveEndpoint: '/api/models/{id}',
      sections: [
        {
          name: 'Prêts',
          endpoint: '/api/models/status/ready',
          component: KanbanAgentItemComponent,
          inputs: { configurationIsMissingTag: true },
          draggable: true,
          add: () => {
            this.router.navigate([`/agents/new`]);
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
      // OPTIMISATION : Un seul endpoint pour toute la colonne
      endpoint: '/api/datasets',
      refreshInterval: 2000, // 1 appel toutes les 2 secondes
      dropable: {
        enabled: true,
        acceptedFrom: ['models']
      },
      sections: [
        {
          name: 'A valider',
          // Filtre local
          filter: (item) => item.status === 'to-validate',
          component: KanbanAgentItemComponent,
          onRemoveEndpoint: '/api/datasets/{id}'
        },
        {
          name: 'En cours',
          filter: (item) => item.status === 'in-building',
          component: KanbanAgentItemComponent,
          draggable: false
        },
        {
          name: 'En attente',
          filter: (item) => item.status === 'to-build',
          component: KanbanAgentItemComponent,
          draggable: false,
          onAddEndpoint: '/api/models/build/{id}',
          onRemoveEndpoint: '/api/datasets/{id}',
          onAddForm: {
            label: 'Configuration du dataset',
            form: this.datasetSizeForm
          }
        },
      ]
    },
    {
      id: 'trains',
      name: 'Entraînement',
      endpoint: '/api/datasets', // Ou un endpoint spécifique pour les trainings si différent
      refreshInterval: 2000,
      dropable: {
        enabled: true,
        acceptedFrom: ['datasets']
      },
      sections: [
        {
          name: 'En erreur',
          filter: (item) => item.status === 'train-failed',
          component: KanbanAgentItemComponent,
          draggable: false,
          onRemoveEndpoint: '/api/datasets/{id}',
        },
        {
          name: 'En cours',
          filter: (item) => item.status === 'in-training',
          component: KanbanAgentItemComponent,
          draggable: false
        },
        {
          name: 'En attente',
          filter: (item) => item.status === 'to-train',
          component: KanbanAgentItemComponent,
          draggable: false,
          onAddEndpoint: '/api/datasets/train/{id}',
          onRemoveEndpoint: '/api/datasets/{id}',
          onAddDialog: {
            component: ConfirmDatasetDialogComponent,
            header: 'Valider le jeu de données',
            width: '450px',
            // Cette fonction est appelée par le KanbanItemComponent au moment du drop
            resolveData: (item: any) => {
              return {
                // On passe une fonction qui retourne l'observable, comme attendu par votre Dialog
                examples: () => this.api.get(`datasets/${item.id}/examples?size=3`)
              };
            }
          }
        },
      ]
    },
    {
      id: 'agents',
      name: 'Agents',
      sections: [
        {
          name: 'Déployés',
          endpoint: '/api/agents/',
          component: KanbanAgentItemComponent,
          draggable: false,
          refreshInterval: 5000 // Polling classique par section ici
        },
      ]
    }
  ];

  public readonly DEFAULT_ACTIVE_KANBAN_ITEM = [0, 1, 2, 3];
  public activeKanbanItem!: number[];

  // ... (Le reste de ngOnInit, setActiveTab, etc. reste inchangé)
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
        this.setActiveTab([]);
        if (agentId) this.setActiveTab([0]);
        else this.setActiveTab(this.DEFAULT_ACTIVE_KANBAN_ITEM);
      });

    this.modelsEvents.modelCreated$.subscribe(model => {
      this.kanban.reload([0]);
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
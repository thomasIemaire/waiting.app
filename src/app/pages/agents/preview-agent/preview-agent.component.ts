import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { InputWLabelComponent } from "../../../components/input-w-label/input-w-label.component";
import { Mapper } from "../../../components/mapper/mapper";
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { ConfigurationFormComponent } from "../../../components/configuration-form/configuration-form.component";
import { ApiService } from "../../../core/services/api.service";
import { DialogAiAgentComponent } from "../../../components/dialog-ai-agent/dialog-ai-agent.component";
import { ModelsEventsService } from "../../../core/services/models-events.service";
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-preview-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputWLabelComponent, Mapper, ConfigurationFormComponent],
  templateUrl: './preview-agent.component.html',
  styleUrls: ['./preview-agent.component.scss'],
  providers: [DialogService, DynamicDialogRef, DynamicDialogConfig]
})
export class PreviewAgentComponent {

  private apiService: ApiService = inject(ApiService);
  private dialogService: DialogService = inject(DialogService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

  public referencePattern: RegExp = /^[a-z-]{1,24}$/;

  private agentId: string | null = null;

  private readonly DEFAULT_CONFIGURATION = {
    name: 'Configuration par défaut',
    description: '',
    attributes: [{
      key: '',
      frequency: 1,
      value: {
        type: '',
        rule: '',
        parameters: {}
      },
      requirements: []
    }],
    formats: ['']
  };

  private readonly DEFAULT_MODEL = {
    id: this.agentId,
    name: 'Modèle d\'agent',
    reference: '',
    description: '',
    mapper: {}
  };

  public model = this.DEFAULT_MODEL;
  public configuration = this.DEFAULT_CONFIGURATION;
  public keys: string[] = [];
  public usingKeys: string[] = [];

  public isNewModel: boolean = false;

ngOnInit() {
    this.route.paramMap.pipe(
      // 1. Récupération de l'ID depuis l'URL
      switchMap(params => {
        this.agentId = params.get('id');

        if (!this.agentId || this.agentId === 'new') {
          // Cas "Nouveau modèle" : on réinitialise tout
          this.model = this.DEFAULT_MODEL;
          this.configuration = this.DEFAULT_CONFIGURATION;
          this.isNewModel = true;
          return of(null); // On arrête le flux ici
        }

        // Cas "Modèle existant" : on appelle l'API pour le modèle
        return this.apiService.get(`models/${this.agentId}`);
      }),
      // 2. Traitement du modèle et récupération de la config liée
      switchMap((agent: any) => {
        if (!agent) return of(null); // Si c'était un nouveau modèle, on ne fait rien de plus

        this.isNewModel = false;

        // On met à jour la vue avec les données du modèle
        this.model = {
          id: agent.id || agent._id,
          name: agent.name,
          reference: agent.reference,
          description: agent.description,
          mapper: agent.mapper ?? {},
          // On stocke temporairement l'ID de la config si besoin, 
          // ou on s'en sert juste pour la requête suivante
          configuration: agent.configuration 
        } as any;

        // Si le modèle possède un ID de configuration, on va la chercher
        if (agent.configuration) {
          return this.apiService.get(`models/configurations/${agent.configuration}`);
        } else {
          // Sinon, on remet la configuration par défaut
          this.configuration = this.DEFAULT_CONFIGURATION;
          return of(null);
        }
      })
    ).subscribe({
      next: (config: any) => {
        // 3. Si une configuration a été trouvée, on met à jour la vue
        if (config) {
          this.configuration = config;
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement :', err);
        this.goBack();
      }
    });
  }

  public ref?: DynamicDialogRef | null;

  public askForHelp(): void {
    this.ref = this.dialogService.open(DialogAiAgentComponent, {
      header: 'Génération assistée par IA',
      width: '500px',
      inputValues: {
        model: this.model === this.DEFAULT_MODEL ? {} : this.model,
        configuration: this.configuration === this.DEFAULT_CONFIGURATION ? {} : this.configuration
      },
      baseZIndex: 10000,
      modal: true,
      closeOnEscape: true,
      closable: true
    });

    this.ref?.onClose.subscribe((result: any) => {
      if (result) {
        this.model = result.model;
        this.configuration = result.configuration;
      }
    });
  }

  public goBack() {
    this.router.navigate(['/agents']);
  }

  private modelsEvents = inject(ModelsEventsService);

  public save() {
    // 1. Préparer la requête de sauvegarde de la configuration
    let configRequest$;

    // Si la config a un ID (donc elle existe), on fait un PUT, sinon un POST
    // Note: Assurez-vous que votre objet configuration a bien un champ '_id' ou 'id'
    const configId = (this.configuration as any)._id || (this.configuration as any).id;

    if (configId && this.configuration !== this.DEFAULT_CONFIGURATION) {
      configRequest$ = this.apiService.put(`models/configurations/${configId}`, this.configuration);
    } else {
      // Création nouvelle config
      configRequest$ = this.apiService.post('models/configurations/', this.configuration);
    }

    // 2. Exécuter la sauvegarde Config PUIS Model
    configRequest$.pipe(
      switchMap((configResponse: any) => {
        // Récupérer l'ID de la configuration sauvegardée/créée
        const savedConfigId = configResponse._id || configResponse.id;

        // Lier la config au modèle
        this.model = {
          ...this.model,
          // @ts-ignore: ajouter dynamiquement la propriété configuration attendue par le back
          configuration: savedConfigId
        };

        // Sauvegarder le modèle
        if (this.isNewModel) {
          return this.apiService.post('models/', this.model);
        } else {
          return this.apiService.put(`models/${this.agentId}`, this.model);
        }
      })
    ).subscribe({
      next: (modelResponse: any) => {
        this.modelsEvents.notifyModelCreated(modelResponse);
        // Mettre à jour l'état local pour ne plus être en "New Model" si on reste sur la page
        this.isNewModel = false;
        this.goBack();
      },
      error: (err) => {
        console.error("Erreur lors de la sauvegarde complète :", err);
        // Ajouter ici une notification utilisateur (Toast/Snackbar)
      }
    });
  }

  public onKeysChange(keys: string[]): void {
    this.keys = keys;
  }

  public usingKeysChange(usingKeys: string[]): void {
    this.usingKeys = usingKeys;    
  }
}
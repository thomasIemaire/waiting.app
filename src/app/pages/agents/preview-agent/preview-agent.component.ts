import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
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
import { DocumentSelectSectionsComponent } from "../../../components/document-select-sections/document-select-sections.component";

@Component({
  selector: 'app-preview-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputWLabelComponent, Mapper, ConfigurationFormComponent, DocumentSelectSectionsComponent],
  templateUrl: './preview-agent.component.html',
  styleUrls: ['./preview-agent.component.scss'],
  providers: [DialogService, DynamicDialogRef, DynamicDialogConfig]
})
export class PreviewAgentComponent implements OnInit {

  private apiService: ApiService = inject(ApiService);
  private dialogService: DialogService = inject(DialogService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private modelsEvents = inject(ModelsEventsService);

  public referencePattern: RegExp = /^[a-z-]{1,24}$/;
  private agentId: string | null = null;

  // Modèle par défaut pour un nouvel agent
  private readonly DEFAULT_MODEL = {
    id: null,
    name: 'Modèle d\'agent',
    reference: '',
    description: '',
    mapper: {}
  };

  public model: any = { ...this.DEFAULT_MODEL };

  // FIX: On initialise à null pour déclencher le bouton "Ajouter" dans l'enfant
  public configuration: any = null;

  public keys: string[] = [];
  public usingKeys: string[] = [];
  public isNewModel: boolean = false;

  public ref?: DynamicDialogRef | null;

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.agentId = params.get('id');

        if (!this.agentId || this.agentId === 'new') {
          // Cas "Nouveau" : on reset tout
          this.model = { ...this.DEFAULT_MODEL };
          this.configuration = null; // Pas de config par défaut
          this.isNewModel = true;
          return of(null);
        }

        // Cas "Édition" : on charge le modèle
        return this.apiService.get(`models/${this.agentId}`);
      }),
      switchMap((agent: any) => {
        if (!agent) return of(null);

        this.isNewModel = false;

        // Reconstruction de l'objet model
        this.model = {
          id: agent.id || agent._id,
          name: agent.name,
          reference: agent.reference,
          description: agent.description,
          mapper: agent.mapper ?? {},
          configurationId: agent.configuration // On garde l'ID de réf
        };

        // Si le modèle a une configuration liée, on la charge
        if (agent.configuration) {
          return this.apiService.get(`models/configurations/${agent.configuration}`);
        } else {
          this.configuration = null;
          return of(null);
        }
      })
    ).subscribe({
      next: (config: any) => {
        if (config) {
          this.configuration = config;
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement:', err);
        this.goBack();
      }
    });
  }

  public askForHelp(): void {
    this.ref = this.dialogService.open(DialogAiAgentComponent, {
      header: 'Génération assistée par IA',
      width: '500px',
      inputValues: {
        model: this.model,
        // Si pas de config, on envoie un objet vide pour l'IA
        configuration: this.configuration ?? {}
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

  public save() {
    // Si aucune configuration n'est définie (null), on sauvegarde directement le modèle
    console.log(this.configuration);
    
    if (!this.configuration) {
      this.saveModel(null);
      return;
    }

    // Sinon, on sauvegarde d'abord la configuration
    let configRequest$;
    const configId = this.configuration._id || this.configuration.id;

    if (configId) {
      configRequest$ = this.apiService.put(`models/configurations/${configId}`, this.configuration);
    } else if (this.configuration && this.configuration.name) {
      configRequest$ = this.apiService.post('models/configurations/', this.configuration);
    } else {
      this.saveModel(null);
      return;
    }

    configRequest$.subscribe({
      next: (configResponse: any) => {
        const savedConfigId = configResponse._id || configResponse.id;
        // On lie l'ID de la config sauvegardée au modèle
        this.saveModel(savedConfigId);
      },
      error: (err) => {
        console.error("Erreur sauvegarde configuration", err);
      }
    });
  }

  private saveModel(configurationId: string | null) {
    const payload = {
      ...this.model,
      configuration: configurationId
    };

    const request$ = this.isNewModel
      ? this.apiService.post('models/', payload)
      : this.apiService.put(`models/${this.agentId}`, payload);

    request$.subscribe({
      next: (res) => {
        this.modelsEvents.notifyModelCreated(res);
        this.isNewModel = false;
        this.goBack();
      },
      error: (err) => console.error("Erreur sauvegarde modèle", err)
    });
  }

  public onKeysChange(keys: string[]): void {
    this.keys = keys;
  }

  public usingKeysChange(usingKeys: string[]): void {
    this.usingKeys = usingKeys;
  }
}
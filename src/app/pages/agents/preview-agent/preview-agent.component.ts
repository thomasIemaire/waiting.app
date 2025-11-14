import { CommonModule } from "@angular/common";
import { Component, inject, SimpleChange, SimpleChanges } from "@angular/core";
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
    this.route.paramMap.subscribe(params => {
      this.agentId = params.get('id');

      if (!this.agentId || this.agentId === 'new') {
        this.model = this.DEFAULT_MODEL;
        this.isNewModel = true;
        return;
      }

      this.apiService.get(`models/${this.agentId}`)?.subscribe({
        next: (agent: any) => {
          this.isNewModel = false;

          this.model = {
            id: agent.id,
            name: agent.name,
            reference: agent.reference,
            description: agent.description,
            mapper: agent.mapper ?? {}
          };
        },
        error: (err: any) => {
          console.error('Erreur lors de la récupération de l\'agent : ', err);
          this.goBack();
        }
      });
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
    if (this.isNewModel) {
      this.apiService.post('models/', this.model).subscribe((response: any) => {
        this.modelsEvents.notifyModelCreated(response);
        this.goBack();
      });
      return;
    }

    this.apiService.put(`models/${this.agentId}`, this.model).subscribe((response: any) => {
      this.modelsEvents.notifyModelCreated(response);
      this.goBack();
    });
  }

  public onKeysChange(keys: string[]): void {
    this.keys = keys;
  }

  public usingKeysChange(usingKeys: string[]): void {
    this.usingKeys = usingKeys;    
  }
}
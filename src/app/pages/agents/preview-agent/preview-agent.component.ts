import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { InputWLabelComponent } from "../../../components/input-w-label/input-w-label.component";
import { Mapper } from "../../../components/mapper/mapper";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { ConfigurationFormComponent } from "../../../components/configuration-form/configuration-form.component";
import { ApiService } from "../../../core/services/api.service";
import { DialogAiAgentComponent } from "../../../components/dialog-ai-agent/dialog-ai-agent.component";

@Component({
  selector: 'app-preview-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputWLabelComponent, Mapper, ConfigurationFormComponent],
  templateUrl: './preview-agent.component.html',
  styleUrls: ['./preview-agent.component.scss'],
  providers: [DialogService]
})
export class PreviewAgentComponent {

  private apiService: ApiService = inject(ApiService);
  private dialogService: DialogService = inject(DialogService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

  public referenceRegex: RegExp = /^[a-z-]{1,16}$/;

  private agentId: string | null = null;

  public model = {
    id: this.agentId,
    name: 'Modèle d\'agent',
    reference: '',
    description: '',
    mapper: {}
  };

  public configuration = {
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

  public keys: string[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.agentId = params.get('id');

      this.apiService.get(`models/${this.agentId}`)?.subscribe((agent: any) => {
        this.model = {
          id: agent.id,
          name: agent.name,
          reference: agent.reference,
          description: agent.description,
          mapper: agent.mapper ?? {}
        };
        this.configuration = agent.configuration;
      });
    });
  }

  public ref?: DynamicDialogRef | null;

  public askForHelp(): void {
      this.ref = this.dialogService.open(DialogAiAgentComponent, {
          header: 'Génération assistée par IA',
          width: '500px',
          baseZIndex: 10000,
          modal: true
      });
  }

  public goBack() {
    this.router.navigate(['/agents']);
  }

  public save() {
    console.log(this.model, this.configuration);
    this.goBack();
  }
}
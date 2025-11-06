import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { InputWLabelComponent } from "../../../components/input-w-label/input-w-label.component";
import { Mapper } from "../../../components/mapper/mapper";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { FormsComponent } from "../../../components/forms/forms.component";
import { SaveFooterComponent } from "../../../components/save-footer/save-footer.component";
import { ConfigurationFormComponent } from "../../../components/configuration-form/configuration-form.component";

@Component({
  selector: 'app-preview-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputWLabelComponent, Mapper, ConfigurationFormComponent],
  template: `
    <div class="preview-agent__container">
      <div class="preview-agent__wrapper">
        <div class="preview-agent__model-wrapper">
          <div class="model-wrapper__header">
            <div class="model-wrapper__header-leftside">
              <p-button icon="pi pi-arrow-left" text label="Retour" severity="secondary" size="small" (click)="goBack()"></p-button>
              <span class="model-wrapper__header-name">{{ model.name}}</span>
            </div>
            <div class="model-wrapper__header-rightside">
              <p-button icon="pi pi-sparkles" label="Demander de l'aide" text severity="secondary" size="small" (click)="askForHelp()"></p-button>
            </div>
          </div>
          <div class="model-wrapper__content">
            <div class="form__wrapper--model">
              <div class="form__inputs-group">
                <app-input-w-label label="Nom" [(value)]="model.name" [required]="true"></app-input-w-label>
                <app-input-w-label label="Référence" [(value)]="model.reference" [required]="true" [mask]="referenceRegex"></app-input-w-label>
              </div>
              <app-input-w-label label="Description" [(value)]="model.description" [recommended]="true"></app-input-w-label>
              <app-mapper label="Schéma retour" [required]="true" [root]="model.reference" [isRoot]="true" (keysChange)="keys = $event"/>
            </div>
            <div class="form__wrapper--configuration">
              <div class="configuration-form__header">
                <div>Configuration</div>
                <div class="configuration-form__header-name">{{ configuration.name }}</div>
              </div>
              <app-configuration-form [keys]="keys" [configuration]="configuration" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preview-agent.component.scss'],
  providers: [DialogService]
})
export class PreviewAgentComponent {

  private dialogService: DialogService = inject(DialogService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

  public referenceRegex: RegExp = /^[a-z-]{1,16}$/;

  private agentId: string | null = null;

  public model = {
    id: this.agentId,
    name: 'Modèle d\'agent ' + (this.agentId ? this.agentId : ''),
    reference: '',
    description: ''
  };

  public configuration = {
    name: 'Configuration par défaut',
    description: '',
    attributes: [{
      name: '',
      frequency: 1,
      value: {
        type: '',
        rule: '',
        parameters: {}
      }
    }],
    formats: ['']
  };

  public keys: string[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.agentId = params.get('id');
    });
  }

  public ref?: DynamicDialogRef | null;
  public askForHelp(): void {
    this.ref = this.dialogService.open(FormsComponent, {
      inputValues: {
        form: {
          items: [
            { label: 'Objectif de l\'agent', value: '', required: true },
          ]
        }
      },
      header: 'Demander de l\'aide',
      width: '512px',
      modal: true,
      contentStyle: { overflow: 'auto' },
      templates: {
        footer: SaveFooterComponent
      }
    });
  }

  public goBack() {
    this.router.navigate(['/agents']);
  }
}
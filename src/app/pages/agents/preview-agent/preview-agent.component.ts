import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { InputWLabelComponent } from "../../../components/input-w-label/input-w-label.component";
import { Mapper } from "../../../components/mapper/mapper";

@Component({
  selector: 'app-preview-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputWLabelComponent, Mapper],
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
              <p-button icon="pi pi-sparkles" label="Demander de l'aide" text severity="secondary" size="small"></p-button>
            </div>
          </div>
          <div class="model-wrapper__content">
            <div class="form__wrapper">
              <div class="form__inputs-group">
                <app-input-w-label label="Nom" [(value)]="model.name" [required]="true"></app-input-w-label>
                <app-input-w-label label="Référence" [(value)]="model.reference" [required]="true"></app-input-w-label>
              </div>
              <app-input-w-label label="Description" [(value)]="model.description" [recommended]="true"></app-input-w-label>
              <app-mapper [root]="model.reference ?? 'root'" [isRoot]="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preview-agent.component.scss']
})
export class PreviewAgentComponent {

  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

  private agentId: string | null = null;

  public model = {
    name: 'Modèle d\'agent ' + (this.agentId ? this.agentId : ''),
    reference: '',
    description: 'Description ' + (this.agentId ? this.agentId : '')
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.agentId = params.get('id');
    });
  }

  public goBack() {
    this.router.navigate(['/agents']);
  }

}
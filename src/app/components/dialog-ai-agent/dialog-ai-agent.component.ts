import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { ApiService } from "../../core/services/api.service";
import { firstValueFrom } from "rxjs";

type GenerationPhase = 'agent' | 'configuration';

@Component({
    selector: 'app-dialog-ai-agent',
    imports: [CommonModule, FormsModule, ToggleSwitchModule, TextareaModule, TableModule, ButtonModule],
    template: `
    <div class="dialog-ai-agent__wrapper">
        @if (!agentGenerating && !configurationGenerating) {
        <div class="dialog-ai-agent__modes-wrapper">
            <div class="ai-agent-mode__wrapper">
                <p-toggleswitch [(ngModel)]="generateAgent" /> Générer un agent
            </div>
            <div class="ai-agent-mode__wrapper">
                <p-toggleswitch [(ngModel)]="generateConfiguration" /> Générer une configuration
            </div>
        </div>
        <textarea rows="5" cols="30" pTextarea [(ngModel)]="prompt" pSize="small" [style.resize]="'none'"></textarea>
        <div class="dialog-ai-agent__actions-wrapper">
            <p-button size="small" label="Fermer" text severity="secondary" (click)="close()" />
            <p-button size="small" label="Demander" (click)="generate()"/>
        </div>
        } @else {
        <div class="dialog-ai-agent__generating-wrapper">
            <span class="shine-link" *ngIf="agentGenerating">
                Génération de l'agent en cours...
            </span>
            <span class="shine-link" *ngIf="configurationGenerating">
                Génération de la configuration en cours...
            </span>
            <span class="dialog-ai-agent__generating-detail" *ngIf="generatingDetails">
                {{ generatingDetails }}
            </span>
        </div>
        }
    </div>
    `,
    styleUrls: ['./dialog-ai-agent.component.scss']
})
export class DialogAiAgentComponent {
    @Input() model: any = {};
    @Input() configuration: any = {};

    /** Détails de progression - Agent */
    private agentGeneratingDetails: string[] = [
        "Analyse du besoin de l'agent...",
        "Création du modèle d'agent...",
        "Définition du nom de l'agent...",
        "Définition de la référence de l'agent...",
        "Rédaction de la description de l'agent...",
        "Configuration du schéma de l'agent..."
    ];

    /** Détails de progression - Configuration */
    private configurationGeneratingDetails: string[] = [
        "Analyse des paramètres de configuration...",
        "Définition des variables et secrets...",
        "Sélection des connecteurs et intégrations...",
        "Mappage des permissions et rôles...",
        "Validation du schéma de configuration...",
        "Génération du fichier de configuration..."
    ];

    public generatingDetails: string = '';

    public generateAgent = true;
    public generateConfiguration = !this.generateAgent;

    public agentGenerating = false;
    public configurationGenerating = false;

    public prompt: string = '';

    private api: ApiService = inject(ApiService);

    private detailIndex = 0;
    private detailInterval: any;
    private currentPhase: GenerationPhase | null = null;

    constructor(public ref: DynamicDialogRef) { }

    close(): void {
        this.ref.close();
    }

    /** Lance l’affichage cyclique des détails pour la phase courante */
    private startGeneratingDetails(phase: GenerationPhase): void {
        this.currentPhase = phase;

        const steps = phase === 'agent'
            ? this.agentGeneratingDetails
            : this.configurationGeneratingDetails;

        // Si la phase n'est pas active, on ne lance rien
        if ((phase === 'agent' && !this.agentGenerating) || (phase === 'configuration' && !this.configurationGenerating)) {
            this.generatingDetails = '';
            return;
        }

        this.detailIndex = 0;
        this.generatingDetails = steps[this.detailIndex];

        this.stopGeneratingDetails(); // sécurité si déjà en cours
        this.detailInterval = setInterval(() => {
            const stillActive = phase === 'agent' ? this.agentGenerating : this.configurationGenerating;
            if (!stillActive) {
                this.stopGeneratingDetails();
                return;
            }

            if (this.detailIndex < steps.length - 1) {
                this.detailIndex++;
                this.generatingDetails = steps[this.detailIndex];

                if (this.detailIndex === steps.length - 1) {
                    clearInterval(this.detailInterval);
                    this.detailInterval = null;
                }
            }
        }, 7500);
    }

    private stopGeneratingDetails(): void {
        if (this.detailInterval) {
            clearInterval(this.detailInterval);
            this.detailInterval = null;
        }
    }

    private startAgentPhase(): number {
        this.agentGenerating = true;
        this.configurationGenerating = false;
        this.startGeneratingDetails('agent');
        return Date.now();
    }

    private endAgentPhase(): void {
        this.agentGenerating = false;
        this.stopGeneratingDetails();
    }

    private startConfigPhase(): void {
        this.configurationGenerating = true;
        this.startGeneratingDetails('configuration');
    }

    private endConfigPhase(): void {
        this.configurationGenerating = false;
        this.stopGeneratingDetails();
    }

    private callModel(): Promise<any> {
        return firstValueFrom(
            this.api.post('models/ai', {
                generate_model: true,
                generate_configuration: false,
                model: this.model,
                configuration: this.configuration,
                prompt: this.prompt,
            })
        );
    }

    private callConfiguration(): Promise<any> {
        return firstValueFrom(
            this.api.post('models/ai', {
                generate_model: false,
                generate_configuration: true,
                model: this.model,
                configuration: this.configuration,
                prompt: this.prompt,
            })
        );
    }

    async generate(): Promise<void> {
        const wantAgent = this.generateAgent;
        const wantConfig = this.generateConfiguration;

        if (wantAgent) {
            this.startAgentPhase();
            try {
                const response = await this.callModel();
                this.model = response.model;
            } catch (e) {
                // gérer l'erreur si besoin
            } finally {
                this.endAgentPhase();
            }
        }

        if (wantConfig) {
            this.startConfigPhase();
            try {
                const response = await this.callConfiguration();
                this.configuration = response.configuration;
            } catch (e) {
                // gérer l'erreur si besoin
            } finally {
                this.endConfigPhase();
            }
        }

        this.ref.close({ model: this.model, configuration: this.configuration });
    }
}

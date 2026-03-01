import { Component, EventEmitter, inject, Input, OnInit, Output, SimpleChanges } from "@angular/core";
import { InputWLabelComponent } from "../input-w-label/input-w-label.component";
import { AttributeConfigurationFormComponent } from "./attribute-configuration-form/attribute-configuration-form.component";
import { DynamicDialogRef, DynamicDialogConfig, DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormatsForm } from "./formats-form/formats-form";
import { DndFileComponent } from "../dnd-file/dnd-file.component";
import { ApiService } from "../../core/services/api.service";
import { MultiSelectModule } from "primeng/multiselect";
import { ModelConfigurationService } from "../../core/services/model-configuration.service";
import { TooltipModule } from "primeng/tooltip";
import { ConstantConfigurationFormComponent } from "./constant-configuration-form/constant-configuration-form.component";

@Component({
    selector: 'app-configuration-form',
    imports: [
        CommonModule,
        DynamicDialogModule,
        FormsModule,
        InputWLabelComponent,
        ButtonModule,
        AttributeConfigurationFormComponent,
        FormatsForm,
        DndFileComponent,
        MultiSelectModule,
        TooltipModule,
        ConstantConfigurationFormComponent
    ],
    templateUrl: './configuration-form.component.html',
    styleUrls: ['./configuration-form.component.scss'],
    standalone: true,
    providers: [DialogService]
})
export class ConfigurationFormComponent implements OnInit {
    @Input() public dialog: boolean = false;
    @Input() public rootKeys: string = "";
    @Input() public keys: string[] = [];
    @Input() public configuration: any = {};
    @Input() public configurationId: string = "";

    @Output() public configurationChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() public usingKeysChange: EventEmitter<string[]> = new EventEmitter<string[]>();

    public usingKeys: string[] = [];
    public waitingConfiguration: boolean = true;

    public showForm: boolean = false;
    private newForm: boolean = false;

    private apiService: ApiService = inject(ApiService);
    public modelConfigurationService: ModelConfigurationService = inject(ModelConfigurationService);
    private dialogService: DialogService = inject(DialogService);

    constructor(public ref: DynamicDialogRef, public cfg: DynamicDialogConfig) { }

    ngOnInit(): void {
        // Récupération des données si ouvert via DialogService
        if (this.cfg.data) {
            this.dialog = this.cfg.data.dialog;
            this.keys = this.cfg.data.keys || [];
            this.rootKeys = this.cfg.data.rootKeys || "";
            this.configurationId = this.cfg.data.configurationId;
        }

        if (this.configurationId) {
            this.loadConfiguration(this.configurationId);
        } else {
            this.initComponent();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['configuration']) {
            this.initComponent();
        }
    }

    private loadConfiguration(id: string): void {
        this.apiService.get(`models/configurations/${id}`).subscribe({
            next: (config) => {
                this.configuration = config;
                this.initComponent();
            },
            error: (err) => {
                console.error(err);
                this.waitingConfiguration = false;
            }
        });
    }

    private initComponent(): void {
        const hasData = this.configuration && (this.configuration.name || (this.configuration.attributes && this.configuration.attributes.length > 0));

        if (hasData || this.configurationId) { // Si ID présent, on considère que le form doit s'afficher
            this.ensureStructure();
            this.showForm = true;
        } else if (this.newForm) {
            this.newForm = false;
        } else if (this.dialog && !this.configurationId) {
            // Cas nouveau via Dialog
            this.createConfiguration();
        } else {
            this.showForm = false;
        }

        this.waitingConfiguration = false;

        if (this.configuration && this.configuration.attributes) {
            this.usingKeys = this.configuration.attributes.map((attr: any) => attr.key);
            this.usingKeysChange.emit(this.usingKeys);
        }
    }

    public createConfiguration(): void {
        this.configuration = {
            name: '',
            description: '',
            attributes: [],
            formats: []
        };
        this.showForm = true;
        this.newForm = true;
        this.configurationChange.emit(this.configuration);
    }

    // NOUVEAU : Méthode pour sauvegarder depuis la modale
    public save(): void {
        if (!this.configuration.name) return; // Validation basique

        let request$;
        if (this.configuration._id || this.configuration.id) {
            const id = this.configuration._id || this.configuration.id;
            request$ = this.apiService.put(`models/configurations/${id}`, this.configuration);
        } else {
            request$ = this.apiService.post('models/configurations/', this.configuration);
        }

        request$.subscribe({
            next: (res) => {
                this.ref.close(res);
            },
            error: (err) => console.error("Erreur sauvegarde config", err)
        });
    }

    private ensureStructure(): void {
        if (!this.configuration) this.configuration = {};
        if (!this.configuration.attributes) this.configuration.attributes = [];
        if (!this.configuration.formats) this.configuration.formats = [];
        if (!this.configuration.negative_configurations) this.configuration.negative_configurations = [];
    }

    public addAttribute(): void {
        this.configuration.attributes.push({
            name: '',
            frequency: 1,
            value: {
                type: '',
                rule: '',
                parameters: { regex: '' }
            }
        });
    }

    public createNegativeConfiguration(): void {
        const ref = this.dialogService.open(ConfigurationFormComponent, {
            header: 'Nouvelle Configuration (Négatif/Bruit)',
            data: {
                dialog: true,
                keys: this.keys,
                rootKeys: this.rootKeys,
                configurationId: null
            },
            width: '70%',
            baseZIndex: 10000,
            modal: true,
            closeOnEscape: true,
            closable: true
        });

        ref?.onClose.subscribe((newConfig: any) => {
            if (newConfig) {
                const newId = newConfig._id || newConfig.id;
                // Mise à jour immuable pour déclencher la détection de changement dans p-multiselect
                this.modelConfigurationService.configurations = [
                    ...this.modelConfigurationService.configurations,
                    {
                        label: newConfig.name,
                        value: newId
                    }
                ];
                this.configuration.negative_configurations.push(newId);
            }
        });
    }

    public addConstant(): void {
        if (!this.configuration.constants) this.configuration.constants = [];
        this.configuration.constants.push({
            key: '',
            type: '',
            value: {
                rule: '',
                parameters: {}
            }
        });
    }

    public constantChange(newConstant: any, index: number): void {
        this.configuration.constants[index] = newConstant;
        this.configurationChange.emit(this.configuration);
    }

    public removeConstant(index: number): void {
        this.configuration.constants.splice(index, 1);
        this.configurationChange.emit(this.configuration);
    }

    public removeAttribute(index: number): void {
        this.configuration.attributes.splice(index, 1);
        this.emitKeysChange();
    }

    public addFormat(): void {
        this.configuration.formats.push('');
    }

    public removeFormat(index: number): void {
        this.configuration.formats.splice(index, 1);
    }

    public updateFormat(newVal: string, index: number): void {
        this.configuration.formats[index] = newVal;
    }

    public attributeChange(attribute: any, index: number): void {
        this.emitKeysChange();
    }

    private emitKeysChange(): void {
        this.usingKeys = this.configuration.attributes.map((attr: any) => attr.key);
        this.usingKeysChange.emit(this.usingKeys);
    }

    private _cachedNegativeConfigs: any[] = [];
    private _lastAllConfigs: any[] | undefined; // Autoriser undefined
    private _lastConfigId: string | null = null;

    get availableNegativeConfigurations(): any[] {
        // 1. On récupère la référence brute du service (sans || [])
        const allConfigs = this.modelConfigurationService.configurations;
        const currentId = this.configurationId || this.configuration?._id || this.configuration?.id;

        // 2. Comparaison stricte : si c'est undefined les deux fois, c'est égal.
        if (allConfigs === this._lastAllConfigs && currentId === this._lastConfigId) {
            return this._cachedNegativeConfigs;
        }

        // 3. Mise à jour des références pour la prochaine fois
        this._lastAllConfigs = allConfigs;
        this._lastConfigId = currentId;

        // 4. On crée le tableau filtré seulement maintenant (avec sécurité || [])
        const source = allConfigs || [];
        this._cachedNegativeConfigs = source.filter((c: any) => c.value !== currentId);

        return this._cachedNegativeConfigs;
    }
}
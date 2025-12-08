import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SelectModule } from 'primeng/select';
import { InputTextModule } from "primeng/inputtext";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { KeyFilter } from "primeng/keyfilter";
import { MultiSelectModule } from 'primeng/multiselect';
import { ModelConfigurationService } from "../../../core/services/model-configuration.service";
import { ModelDataService } from "../../../core/services/model-data.service";
import { ConfigurationFormComponent } from "../configuration-form.component";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { DataDialog } from "../attribute-configuration-form/data-dialog/data-dialog";
import { ApiService } from "../../../core/services/api.service";

@Component({
    selector: 'app-constant-configuration-form',
    imports: [CommonModule, FormsModule, SelectModule, InputTextModule, Button, Tooltip, KeyFilter, MultiSelectModule],
    templateUrl: './constant-configuration-form.component.html',
    styleUrls: ['./constant-configuration-form.component.scss'],
    providers: [DialogService]
})
export class ConstantConfigurationFormComponent {
    @Input()
    public first: boolean = false;

    @Input()
    public constant: any = {};

    @Output()
    public remove: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    public constantChange: EventEmitter<any> = new EventEmitter<any>();

    public modelConfigurationService: ModelConfigurationService = inject(ModelConfigurationService);
    public modelDataService: ModelDataService = inject(ModelDataService);
    private dialogService: DialogService = inject(DialogService);
    private apiService: ApiService = inject(ApiService);

    public types: any[] = [
        { label: "Chaine de caractères", value: 'string' },
        { label: "Nombre", value: 'number' },
    ]

    public rules: any[] = [
        { label: 'Calcul / Formule', value: 'calculation' },
        { label: 'Configuration', value: 'configuration' },
        { label: 'Entier aléatoire', value: 'randint' },
        { label: 'Expression régulière', value: 'alphanumeric' },
        { label: 'Liste de données', value: 'data' }
    ];

    public frequencyPattern: RegExp = /^(?:0(?:\.\d*)?|1(?:\.0*)?)$/;

    ngOnInit(): void {
        if (!this.constant.type)
            this.constant.type = this.types[0].value;

        if (!this.constant.value.rule)
            this.constant.value.rule = this.rules[0].value;
    }

    public keyChange(): void {
        this.constantChange.emit(this.constant);
    }

    public ruleChange(): void {
        if (this.constant.value.rule === 'randint')
            this.constant.type = 'number';

        // Initialiser parameters si inexistant
        if (!this.constant.value.parameters) {
            this.constant.value.parameters = {};
        }
    }

    public ref?: DynamicDialogRef | null;

    public openConfiguration(): void {
        const configId = this.constant.value.parameters.object_id;
        if (!configId) return;

        const configLabel = this.modelConfigurationService.configurations?.find(c => c.value === configId)?.label || 'Configuration';

        this.ref = this.dialogService.open(ConfigurationFormComponent, {
            header: configLabel,
            data: {
                dialog: true,
                configurationId: configId
            },
            width: '70%',
            baseZIndex: 10000,
            modal: true,
            closeOnEscape: true,
            closable: true
        });

        this.ref?.onClose.subscribe((result: any) => {
            if (result) {
                this.refreshConfigurations();
            }
        });
    }

    public createConfiguration(): void {
        this.ref = this.dialogService.open(ConfigurationFormComponent, {
            header: 'Nouvelle Configuration',
            data: {
                dialog: true,
                configurationId: null
            },
            width: '70%',
            baseZIndex: 10000,
            modal: true,
            closeOnEscape: true,
            closable: true
        });

        this.ref?.onClose.subscribe((newConfig: any) => {
            if (newConfig) {
                this.refreshConfigurations(newConfig._id || newConfig.id);
            }
        });
    }

    private refreshConfigurations(selectId: string | null = null): void {
        this.apiService.get('models/configurations/').subscribe((configs: any) => {
            this.modelConfigurationService.configurations = configs.map((c: any) => ({
                label: c.name,
                value: c.id || c._id
            }));

            if (selectId) {
                this.constant.value.parameters.object_id = selectId;
            }
        });
    }

    public openData(): void {
        const dataId = this.constant.value.parameters.object_id;
        if (!dataId) return;

        const dataLabel = this.modelDataService.datas?.find(d => d.value === dataId)?.label || 'Données';

        this.ref = this.dialogService.open(DataDialog, {
            header: dataLabel,
            data: {
                dataId: dataId
            },
            width: '50%',
            baseZIndex: 10000,
            modal: true,
            closeOnEscape: true,
            closable: true
        });

        this.ref?.onClose.subscribe((result: any) => {
            if (result) this.refreshDatas();
        });
    }

    public createData(): void {
        this.ref = this.dialogService.open(DataDialog, {
            header: 'Nouvelle liste de données',
            data: {
                dataId: null
            },
            width: '50%',
            baseZIndex: 10000,
            modal: true,
            closeOnEscape: true,
            closable: true
        });

        this.ref?.onClose.subscribe((newData: any) => {
            if (newData) {
                this.refreshDatas(newData._id || newData.id);
            }
        });
    }

    private refreshDatas(selectId: string | null = null): void {
        this.apiService.get('models/data/').subscribe((datas: any) => {
            this.modelDataService.datas = datas.map((d: any) => ({
                label: d.name,
                value: d.id || d._id
            }));

            if (selectId) {
                this.constant.value.parameters.object_id = selectId;
            }
        });
    }
}
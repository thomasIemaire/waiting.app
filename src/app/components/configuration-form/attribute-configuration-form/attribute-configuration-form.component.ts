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
import { DataDialog } from "./data-dialog/data-dialog";
import { AttributeRequirementDialog } from "./attribute-requirement-dialog/attribute-requirement-dialog";

@Component({
    selector: 'app-attribute-configuration-form',
    imports: [CommonModule, FormsModule, SelectModule, InputTextModule, Button, Tooltip, KeyFilter, MultiSelectModule],
    templateUrl: './attribute-configuration-form.component.html',
    styleUrls: ['./attribute-configuration-form.component.scss'],
    providers: [DialogService]
})
export class AttributeConfigurationFormComponent {
    @Input()
    public rootKeys: string = "";

    @Input()
    public first: boolean = false;

    @Input()
    public keys: any[] = [];

    @Input()
    public attribute: any = {};

    @Output()
    public remove: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    public attributeChange: EventEmitter<any> = new EventEmitter<any>();

    public modelConfigurationService: ModelConfigurationService = inject(ModelConfigurationService);
    public modelDataService: ModelDataService = inject(ModelDataService);
    private dialogService: DialogService = inject(DialogService);

    public types: any[] = [
        { label: "Chaine de caractères", value: 'string' },
        { label: "Nombre", value: 'number' },
        { label: "Liste", value: 'list' }
    ]

    public rules: any[] = [
        { label: 'Configuration', value: 'configuration' },
        { label: 'Entier aléatoire', value: 'randint' },
        { label: 'Expression régulière', value: 'alphanumeric' },
        { label: 'Liste de données', value: 'data' }
    ];

    public frequencyPattern: RegExp = /^(?:0(?:\.\d*)?|1(?:\.0*)?)$/;

    ngOnInit(): void {
        if (!this.attribute.type)
            this.attribute.type = this.types[0].value;

        if (!this.attribute.value.rule)
            this.attribute.value.rule = this.rules[0].value;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['keys'] || changes['rootKeys']) {
            this.keys.forEach(key => {
                const root = this.rootKeys ?? key.value.split('_')[0];
                this.setRootForKeys(root.toUpperCase());
            });
        }
    }

    public keyChange(): void {
        this.attributeChange.emit(this.attribute);
    }

    public ruleChange(): void {
        if (this.attribute.value.rule === 'randint')
            this.attribute.type = 'number';
    }

    private setRootForKeys(root: string): void {
        this.keys = this.keys.map(key => {
            return {
                ...key,
                value: this.restoreRootForKey(root, key.value)
            };
        });
        this.attribute.key = this.restoreRootForKey(root, this.attribute.key);
        this.attributeChange.emit(this.attribute);
    }

    private restoreRootForKey(root: string, key: string): string {
        if (!key || !key.includes('_')) return key;
        let attributeKeyList = key.split('_');
        attributeKeyList[0] = root;
        return attributeKeyList.join('_');
    }

    public ref?: DynamicDialogRef | null;

    public openConfiguration(): void {
        this.ref = this.dialogService.open(ConfigurationFormComponent, {
            header: this.modelConfigurationService.configurations.find(c => c.value === this.attribute.value.parameters.object_id)?.label || 'Configuration',
            inputValues: {
                dialog: true,
                keys: this.keys,
                rootKeys: this.rootKeys,
                configurationId: this.attribute.value.parameters.object_id
            },
            width: '70%',
            baseZIndex: 10000,
            modal: true,
            closeOnEscape: true,
            closable: true
        });

        this.ref?.onClose.subscribe((result: any) => {
        });
    }

    public openData(): void {
        this.ref = this.dialogService.open(DataDialog, {
            header: this.modelDataService.datas.find(d => d.value === this.attribute.value.parameters.object_id)?.label || 'Données',
            inputValues: {
                dataId: this.attribute.value.parameters.object_id
            },
            width: '50%',
            baseZIndex: 10000,
            modal: true,
            closeOnEscape: true,
            closable: true
        });

        this.ref?.onClose.subscribe((result: any) => {
        });
    }

    public openRequirementDialog(attribute: any, requirement: any = { rule: '', constraint: '' }, method: 'add' | 'edit' = 'add') {
        this.ref = this.dialogService.open(AttributeRequirementDialog, {
            header: "Requirement",
            width: '400px',
            contentStyle: { overflow: 'auto' },
            modal: true,
            appendTo: 'body',
            data: { requirement }
        });

        this.ref?.onClose.subscribe((requirementUpdated: any) => {
            if (requirementUpdated) {
                if (method === 'add')
                    attribute.requirements = [...attribute.requirements, requirementUpdated];
                else
                    Object.assign(requirement, requirementUpdated);
            }
        });
    }
}
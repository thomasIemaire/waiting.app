import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { InputWLabelComponent } from "../input-w-label/input-w-label.component";
import { AttributeConfigurationFormComponent } from "./attribute-configuration-form/attribute-configuration-form.component";
import { DynamicDialogRef, DynamicDialogConfig, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormatsForm } from "./formats-form/formats-form";
import { DndFileComponent } from "../dnd-file/dnd-file.component";
import { ApiService } from "../../core/services/api.service";

@Component({
    selector: 'app-configuration-form',
    imports: [CommonModule, DynamicDialogModule, FormsModule, InputWLabelComponent, ButtonModule, AttributeConfigurationFormComponent, FormatsForm, DndFileComponent],
    templateUrl: './configuration-form.component.html',
    styleUrls: ['./configuration-form.component.scss'],
    standalone: true
})
export class ConfigurationFormComponent {
    @Input()
    public dialog: boolean = false;

    @Input()
    public rootKeys: string = "";

    @Input()
    public keys: string[] = [];

    @Input()
    public configuration: any = {};

    @Input()
    public configurationId: string = "";

    @Output()
    public configurationChange: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public usingKeysChange: EventEmitter<string[]> = new EventEmitter<string[]>();

    public usingKeys: string[] = [];
    public waitingConfiguration: boolean = true;

    private apiService: ApiService = inject(ApiService);

    constructor(public ref: DynamicDialogRef, public cfg: DynamicDialogConfig) { }

    async ngOnInit(): Promise<void> {
        if (this.configurationId)
            this.apiService.get<any>(`models/configurations/${this.configurationId}`).subscribe((data: any) => {
                this.configuration = data;
                this.waitingConfiguration = false;
            });

        if (this.configuration)
            this.waitingConfiguration = false;
    }

    public addAttribute(): void {
        this.configuration.attributes.push({
            name: '',
            frequency: 1,
            value: {
                type: '',
                rule: '',
                parameters: {
                    regex: ''
                }
            }
        });
    }

    public removeAttribute(index: number): void {
        this.configuration.attributes.splice(index, 1);
    }

    public addFormat(): void {
        this.configuration.formats.push('');
    }

    public removeFormat(index: number): void {
        this.configuration.formats.splice(index, 1);
    }

    public attributeChange(attribute: any, index: number): void {
        this.usingKeys = this.configuration.attributes.map((attr: any) => attr.key);
        this.usingKeysChange.emit(this.usingKeys);
    }
}
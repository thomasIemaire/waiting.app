import { Component, EventEmitter, Input, Output } from "@angular/core";
import { InputWLabelComponent } from "../input-w-label/input-w-label.component";
import { AttributeConfigurationFormComponent } from "./attribute-configuration-form/attribute-configuration-form.component";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormatsForm } from "./formats-form/formats-form";

@Component({
    selector: 'app-configuration-form',
    imports: [CommonModule, FormsModule, InputWLabelComponent, ButtonModule, AttributeConfigurationFormComponent, FormatsForm],
    templateUrl: './configuration-form.component.html',
    styleUrls: ['./configuration-form.component.scss'],
    standalone: true
})
export class ConfigurationFormComponent {
    @Input()
    public keys: string[] = [];

    @Input()
    public configuration: any = {
        name: '',
        frequency: 1,
        value: {
            type: '',
            rule: '',
            parameters: {
                regex: ''
            }
        }
    };

    @Output()
    public configurationChange: EventEmitter<any> = new EventEmitter<any>();

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
}
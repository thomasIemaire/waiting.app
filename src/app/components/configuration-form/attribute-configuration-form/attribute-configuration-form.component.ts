import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SelectModule } from 'primeng/select';
import { InputTextModule } from "primeng/inputtext";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { KeyFilter } from "primeng/keyfilter";
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-attribute-configuration-form',
    imports: [CommonModule, FormsModule, SelectModule, InputTextModule, Button, Tooltip, KeyFilter, MultiSelectModule],
    templateUrl: './attribute-configuration-form.component.html',
    styleUrls: ['./attribute-configuration-form.component.scss']
})
export class AttributeConfigurationFormComponent {
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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['keys']) {
            this.keys.forEach(key => {
                const root = key.value.split('_')[0];
                this.setRootForKey(root);
            });
        }
    }

    private setRootForKey(root: string): void {
        if (!this.attribute.key.includes('_')) return;
        let attributeKeyList = this.attribute.key.split('_');
        attributeKeyList[0] = root;
        this.attribute.key = attributeKeyList.join('_');
    }
}
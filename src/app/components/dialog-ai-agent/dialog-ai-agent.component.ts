import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from "primeng/table";

@Component({
    selector: 'app-dialog-ai-agent',
    imports: [CommonModule, FormsModule, ToggleSwitchModule, TextareaModule, DynamicDialogModule, TableModule],
    template: `
    <div class="dialog-ai-agent__wrapper">
        <div class="dialog-ai-agent__modes-wrapper">
            <div class="ai-agent-mode__wrapper">
                <p-toggleswitch [(ngModel)]="generateAgent" /> Générer un agent
            </div>
            <div class="ai-agent-mode__wrapper">
                <p-toggleswitch [(ngModel)]="generateConfiguration" /> Générer une configuration
            </div>
        </div>
        <textarea rows="5" cols="30" pTextarea [(ngModel)]="prompt" pSize="small" [style.resize]="'none'"></textarea>
    </div>
    `,
    styleUrls: ['./dialog-ai-agent.component.scss'],
    providers: [DialogService]
})
export class DialogAiAgentComponent {

    public generateAgent: boolean = false;
    public generateConfiguration: boolean = false;

    public prompt: string = '';

    ref: DynamicDialogRef | undefined;

    constructor(public dialogService: DialogService) { }

}
import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TagModule } from 'primeng/tag';
import { UserService } from "../../core/services/user.service";
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from "primeng/tooltip";

@Component({
    selector: 'app-kanban-agent-item',
    imports: [CommonModule, FormsModule, TagModule, ProgressBarModule, TooltipModule],
    template: `
    <div class="kanban-agent-item__wrapper">
        <div *ngIf="configurationIsMissingTag && !hasConfiguration" class="has-no-configuration-warning">
            Aucune configuration définie
        </div>

        <div class="kanban-agent-item__header">
            <div class="kanban-agent-item__header-names">
                <i *ngIf="configurationIsMissingTag && !hasConfiguration" pTooltip="Aucune configuration" class="pi pi-exclamation-triangle"></i>
                <div class="kanban-agent-item__header-name">{{data.name}}</div>
                <div class="kanban-agent-item__header-reference">{{data.reference}}</div>
            </div>
            <div class="kanban-agent-item__header-version">
                <p-tag size="small" rounded>{{data.version}}</p-tag>
            </div>
        </div>
        <div class="kanban-agent-item__body">
            <div *ngIf="data.progress && data.progress != 1" class="kanban-agent-item__body-progress">
                <p-progressbar [value]="data.progress*100" [showValue]="false" />
                <div class="kanban-agent-item__body-progress-value">
                    {{(data.progress * 100) | number:'1.1-1'}}%
                </div>
            </div>
            <div *ngIf="!data.progress || data.progress == 1" class="kanban-agent-item__body-details">
                {{data.description}}
            </div>
        </div>
        <div class="kanban-agent-item__footer">
            <div class="kanban-agent-item__footer-avatar" [style.backgroundImage]="'url(' + userService.getAvatarUrl(data.created_by.id!) + ')'">
            </div>
            <div class="kanban-agent-item__footer-info">
                <div class="kanban-agent-item__footer-user">
                    Créé par <div class="user-name">{{data.created_by.firstname}} {{data.created_by.lastname}}</div>
                </div>
                <div class="kanban-agent-item__footer-date">
                    Le {{data.created_at | date:'short'}}
                </div>
            </div>
        </div>
    </div>
    `,
    styleUrls: ['./kanban-agent-item.component.scss']
})
export class KanbanAgentItemComponent {
    public userService: UserService = inject(UserService);

    @Input() data: any;
    @Input() configurationIsMissingTag: boolean = false;

    public get hasConfiguration(): boolean {
        return this.data && this.data.configuration;
    }
}
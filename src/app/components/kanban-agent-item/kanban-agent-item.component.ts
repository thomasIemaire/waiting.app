import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TagModule } from 'primeng/tag';
import { UserService } from "../../core/services/user.service";

@Component({
    selector: 'app-kanban-agent-item',
    imports: [CommonModule, FormsModule, TagModule],
    template: `
    <div class="kanban-agent-item__wrapper">
        <div class="kanban-agent-item__header">
            <div class="kanban-agent-item__header-names">
                <div class="kanban-agent-item__header-name">{{data.name}}</div>
                <div class="kanban-agent-item__header-reference">{{data.reference}}</div>
            </div>
            <div class="kanban-agent-item__header-version">
                <p-tag size="small" rounded>{{data.version}}</p-tag>
            </div>
        </div>
        <div class="kanban-agent-item__body">
            <div class="kanban-agent-item__body-details">
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
}
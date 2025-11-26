import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { UserService } from "../../core/services/user.service";

@Component({
    selector: 'app-list-flow-item',
    imports: [CommonModule],
    template: `
    <div class="list-flow-item__container">
        <div class="list-flow-item__wrapper">
            <div class="list-flow-item__header">
                <div class="list-flow-item__header-icon">
                    <i class="pi pi-sitemap"></i>
                </div>
            </div>
            <div class="list-flow-item__body">
                <div class="list-flow-item__title">
                    {{ flow.name }}
                </div>
                <div class="list-flow-item__description">
                    {{ flow.description }}
                </div>
            </div>
            <div class="list-flow-item__footer">
                <div class="list-flow-item__footer-avatar" [style.backgroundImage]="'url(' + userService.getAvatarUrl(flow.created_by.id!) + ')'">
                </div>
                <div class="list-flow-item__footer-info">
                    <div class="list-flow-item__footer-user">
                        Créé par <div class="user-name">{{flow.created_by.firstname}} {{flow.created_by.lastname}}</div>
                    </div>
                    <div class="list-flow-item__footer-date">
                        Le {{flow.created_at | date:'short'}}
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    styleUrls: ['./list-flow-item.component.scss']
})
export class ListFlowItemComponent {
    @Input() flow: any;

    public userService: UserService = inject(UserService);
}
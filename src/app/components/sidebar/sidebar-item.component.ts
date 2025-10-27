import { Component, inject, Input } from "@angular/core";
import { MenuItem } from "./sidebar.component";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MessageService } from "primeng/api";
import { Toast } from "primeng/toast";

@Component({
    selector: 'app-sidebar-item',
    imports: [CommonModule, RouterLink, RouterLinkActive, Toast],
    template: `
    <p-toast />
    <div class="sidebar-item__wrapper" 
        (click)="item.command ? item.command() : null"
        [routerLink]="item.enabled ? item.link : null"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }">
        <div class="sidebar-item__content">
            <i class="sidebar-item__icon" [ngClass]="item.icon"></i>
            <span class="sidebar-item__label">{{ item.label }}</span>
        </div>
        <div class="sidebar-item__enabled" *ngIf="item.enabled === false">
            <i class="sidebar-item__icon pi pi-lock"></i>
        </div>
    </div>
    `,
    styles: `
    .sidebar-item__wrapper {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: .5rem 1rem;
        gap: 1.2rem;
        cursor: pointer;
        user-select: none;
        border-radius: var(--radius-m);
        font-size: .75rem !important;
        color: var(--p-text-muted-color);

        &.active,
        &:hover {
            background-color: var(--background-color-100);
            color: var(--p-text-color);
        }

        .sidebar-item__content {
            display: flex;
            align-items: center;
            gap: 1.2rem;
            flex: 1 1 auto;
            min-width: 0;

            .sidebar-item__icon {
                font-size: .75rem !important;
            }

            .sidebar-item__label {
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }
        }

        .sidebar-item__enabled {
            .sidebar-item__icon {
                font-size: .6rem !important;
            }
        }
    }
    `,
    providers: [MessageService]
})
export class SidebarItemComponent {
    @Input({ required: true })
    public item!: MenuItem;

    private messageService = inject(MessageService);

    ngOnInit() {
        if (this.item.enabled === false)
            this.item.command = () => {
                this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Cette fonctionnalité est verrouillée.' });
            };
        else
            this.item.enabled = true;
    }
}
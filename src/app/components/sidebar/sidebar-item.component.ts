import { Component, Input } from "@angular/core";
import { MenuItem } from "./sidebar.component";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
    selector: 'app-sidebar-item',
    imports: [CommonModule, RouterLink, RouterLinkActive],
    template: `
    <div class="sidebar-item__wrapper" 
        (click)="item.command ? item.command() : null"
        [routerLink]="item.link"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }">
        <i class="sidebar-item__icon" [ngClass]="item.icon"></i>
        <span class="sidebar-item__label">{{ item.label }}</span>
    </div>
    `,
    styles: `
    .sidebar-item__wrapper {
        width: 100%;
        display: flex;
        align-items: center;
        padding: .5rem 1rem;
        gap: 1.2rem;
        cursor: pointer;
        user-select: none;
        border-radius: .5rem;
        font-size: .75rem !important;
        color: var(--p-text-muted-color);

        &.active,
        &:hover {
            background-color: var(--background-color-100);
            color: var(--p-text-color);
        }

        .sidebar-item__icon {
            font-size: .75rem !important;
        }

        .sidebar-item__label {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }
    }
    `
})
export class SidebarItemComponent {
    @Input({ required: true })
    public item!: MenuItem;
}
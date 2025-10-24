import { Component, inject } from "@angular/core";
import { ThemeService } from "../../core/services/theme.service";
import { CommonModule } from "@angular/common";
import { SidebarItemComponent } from "./sidebar-item.component";

class Menu {
    label?: string;
    items?: MenuItem[];
}

export class MenuItem {
    label?: string;
    icon?: string
    link?: string;
    command?: () => void;
}

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, SidebarItemComponent],
    template: `
    <div class="sidebar__container">
        <div class="sidebar__wrapper">
            <div class="menu__container">
                <div class="menu__wrapper" *ngFor="let menu of menus">
                    <span class="menu__label">{{ menu.label }}</span>
                    <div class="menu__items">
                        <app-sidebar-item *ngFor="let item of menu.items" [item]="item" />
                    </div>
                </div>
            </div>
            <div class="sidebar__footer">
                <app-sidebar-item *ngFor="let item of settings" [item]="item" />
            </div>
        </div>
    </div>
    `,
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

    private themeService: ThemeService = inject(ThemeService);

    public admin: boolean = true;

    public menus: Menu[] = [];

    public mainMenu: Menu = {
        label: 'Espace de démonstration',
        items: [
            {
                label: 'Documents',
                icon: 'pi pi-file',
                link: '/documents'
            },
            {
                label: 'Contacts',
                icon: 'pi pi-users',
                link: '/contacts'
            },
            {
                label: 'Fournisseurs',
                icon: 'pi pi-building',
                link: '/suppliers'
            }
        ]
    };

    private adminMenu: Menu = {
        label: 'Administration',
        items: [
            {
                label: 'Agents',
                icon: 'pi pi-microchip-ai',
                link: '/agents'
            },
            {
                label: 'Flows',
                icon: 'pi pi-sitemap',
                link: '/flows'
            }
        ]
    };

    public settings: MenuItem[] = [
        {
            label: this.themeService.isDarkMode() ? 'Mode clair' : 'Mode sombre',
            icon: this.themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon',
            command: () => this.themeService.toggleTheme()
        },
        {
            label: 'Paramètres',
            icon: 'pi pi-cog',
            link: '/settings'
        }
    ];

    ngOnInit(): void {
        this.menus = [
            this.admin ? this.adminMenu : {},
            this.mainMenu
        ].filter(menu => menu.items && menu.items.length > 0) as Menu[];

        this.themeService.theme.value$.subscribe(() => {
            this.settings[0].label = this.themeService.isDarkMode() ? 'Mode clair' : 'Mode sombre';
            this.settings[0].icon = this.themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon';
        });
    }
}
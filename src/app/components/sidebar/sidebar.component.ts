import { Component, inject } from "@angular/core";
import { ThemeService } from "../../core/services/theme.service";
import { CommonModule } from "@angular/common";
import { SidebarItemComponent } from "./sidebar-item.component";
import { UserService } from "../../core/services/user.service";
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from "primeng/api";
import { AuthService } from "../../core/services/auth.service";

class Menu {
    label?: string;
    items?: MenuItem[];
}

export class MenuItem {
    label?: string;
    icon?: string
    link?: string;
    command?: () => void;
    enabled?: boolean;
}

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, SidebarItemComponent, ConfirmDialog, ButtonModule],
    template: `
    <p-confirmdialog [draggable]="false" [closable]="false" />
    <div class="sidebar__container">
        <div class="sidebar__wrapper">
            <div class="menu__container">
                <div class="menu__wrapper" *ngFor="let menu of this.userService.getUser()?.isAdmin() ? [adminMenu, mainMenu] : [mainMenu]">
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
    styleUrl: './sidebar.component.scss',
    providers: [ConfirmationService]
})
export class SidebarComponent {

    private themeService: ThemeService = inject(ThemeService);
    public userService: UserService = inject(UserService);
    private confirmationService: ConfirmationService = inject(ConfirmationService);
    private authService: AuthService = inject(AuthService);

    public menus: Menu[] = [];

    public mainMenu: Menu = {
        label: 'Espace de démonstration',
        items: [
            {
                label: 'Restaurer l\'espace',
                icon: 'pi pi-sync',
                command: () => this.confirm()
            },
            {
                label: 'Documents',
                icon: 'pi pi-file',
                link: '/documents'
            },
            {
                label: 'Clients',
                icon: 'pi pi-users',
                link: '/customers'
            },
            {
                label: 'Fournisseurs',
                icon: 'pi pi-building',
                link: '/suppliers'
            }
        ]
    };

    public adminMenu: Menu = {
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
                link: '/flows',
                enabled: false
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
        this.themeService.theme.value$.subscribe(() => {
            this.settings[0].label = this.themeService.isDarkMode() ? 'Mode clair' : 'Mode sombre';
            this.settings[0].icon = this.themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon';
        });
    }

    private confirm() {
        this.confirmationService.confirm({
            header: 'Confirmation',
            message: `
            <div class="flex flex-column text-center font-medium"> 
                <span>Êtes-vous sûr de vouloir restaurer l'espace ?</span>
                <span class="bold">Cette action vous déconnectera.</span>
            </div>`,

            acceptLabel: 'Restaurer',
            rejectLabel: 'Annuler',

            acceptButtonStyleClass: 'p-button-sm',
            rejectButtonStyleClass: 'p-button-secondary p-button-sm p-button-text',

            accept: async () => {
                await this.userService.restoreUserData();
                this.authService.signout()
            }
        });
    }
}
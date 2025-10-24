import { Component, inject } from "@angular/core";
import { UserService, User } from "../../core/services/user.service";

@Component({
    selector: 'app-user-avatar-details',
    imports: [],
    template: `
    <div class="user-avatar-details__wrapper">
        <div class="user-avatar-details-left__wrapper">
            <div class="user-fullname">{{ user.getFullname() }}</div>
            <div class="user-email">{{ user.email }}</div>
        </div>
        <div class="user-avatar-details-right__wrapper">
            <div class="user-avatar"></div>
        </div>
    </div>
    `,
    styleUrls: ['./user-avatar-details.component.scss'],
})
export class UserAvatarDetailsComponent {
    public userService: UserService = inject(UserService);

    public user!: User;

    ngOnInit() {
        this.userService.user.value$.subscribe(user => {
            this.user = user!;
        });
    }
}
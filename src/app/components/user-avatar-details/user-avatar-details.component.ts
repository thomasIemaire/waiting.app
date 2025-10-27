import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
    private readonly userService: UserService = inject(UserService);
    private readonly destroyRef: DestroyRef = inject(DestroyRef);

    public user: User = new User();

    constructor() {
        this.userService.user.value$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((user) => {
                this.user = user ? new User(user) : new User();
            });
    }
}
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
    const userService = inject(UserService);
    const router = inject(Router);

    const currentUser = userService.user.value;

    if (currentUser) {
        return true;
    }

    return router.createUrlTree(['/auth/signin']);
};

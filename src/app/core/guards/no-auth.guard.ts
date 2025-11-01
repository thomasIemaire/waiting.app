import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserService } from '../services/user.service';

export const noAuthGuard: CanActivateFn = (): boolean | UrlTree => {
    const userService = inject(UserService);

    const currentUser = userService.user.value;

    if (!currentUser) {
        return true;
    }

    return false;
};

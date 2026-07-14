import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const role = authService.role();
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Guests see a dedicated "pending authorization" explanation instead of a generic 403,
    // since they are legitimately authenticated but simply not yet authorized operationally.
    if (role === 'guest') {
      return router.createUrlTree(['/access-pending']);
    }

    return router.createUrlTree(['/forbidden']);
  };
}

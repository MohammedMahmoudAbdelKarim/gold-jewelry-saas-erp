import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  // Check required permissions on the route
  const requiredPermission = route.data?.['requiredPermission'];
  if (requiredPermission) {
    const user = authService.currentUser();
    
    // If permissions array is missing, the session is stale. Log out to reset.
    if (!user || !user.permissions) {
      authService.logout();
      return router.parseUrl('/login');
    }

    if (!user.permissions.includes(requiredPermission)) {
      // Redirect to home if they have Dashboard.View, otherwise to /profile to avoid infinite loops
      if (user.permissions.includes('Dashboard.View') && route.routeConfig?.path !== '') {
        return router.parseUrl('/');
      } else {
        return router.parseUrl('/profile');
      }
    }
  }

  return true;
};

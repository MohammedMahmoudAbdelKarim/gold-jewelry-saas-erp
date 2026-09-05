import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// In a real app, this would check an AuthService or UserStore
export const canManageInventory: CanActivateFn = () => {
  const router = inject(Router);
  
  // Mock check: assume user has permission for now.
  const hasPermission = true; 
  
  if (!hasPermission) {
    return router.parseUrl('/unauthorized');
  }
  return true;
};

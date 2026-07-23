import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../auth/auth.models';
import { AuthStore } from '../auth/auth.store';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthStore);
  const expectedRole = route.data['role'] as UserRole;
  if (!auth.isAuthenticated()) return inject(Router).parseUrl('/login');
  return auth.hasRole(expectedRole) ? true : inject(Router).parseUrl('/unauthorized');
};

export const landingGuard: CanActivateFn = () => inject(Router).parseUrl(inject(AuthStore).landingPage());

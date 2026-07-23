import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isAuthenticated() ? inject(Router).parseUrl(auth.landingPage()) : true;
};

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { NotificationService } from '../services/notification.service';
import { ApiErrorService } from './api-error.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const errors = inject(ApiErrorService);
  const notifications = inject(NotificationService);

  return next(request).pipe(catchError((error: unknown) => {
    if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
    const normalized = errors.normalize(error);

    if (error.status === 401) {
      const currentUrl = router.url;
      auth.logout(false);
      void router.navigate(['/login'], { queryParams: currentUrl !== '/login' ? { returnUrl: currentUrl } : undefined });
    } else if (error.status === 403) {
      void router.navigate(['/unauthorized']);
    } else if (error.status === 0 || error.status >= 500) {
      notifications.show(normalized.message, 'error');
    }

    return throwError(() => normalized);
  }));
};

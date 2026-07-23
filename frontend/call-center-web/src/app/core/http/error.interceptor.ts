import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { ApiErrorService } from './api-error.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const errors = inject(ApiErrorService);

  return next(request).pipe(catchError((error: unknown) => {
    if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
    const normalized = errors.normalize(error);

    if (error.status === 401) {
      const currentUrl = router.url;
      auth.logout(false);
      void router.navigate(['/login'], { queryParams: currentUrl !== '/login' ? { returnUrl: currentUrl } : undefined });
    } else if (error.status === 403) {
      void router.navigate(['/unauthorized']);
    }

    return throwError(() => normalized);
  }));
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from './api-base-url.token';
import { AuthStore } from '../auth/auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const apiBaseUrl = inject(API_BASE_URL);
  const token = auth.token();
  const isApiRequest = request.url.startsWith(apiBaseUrl);

  return next(token && isApiRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request);
};

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError } from './api-error.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  normalize(error: HttpErrorResponse): ApiError {
    const body = error.error && typeof error.error === 'object' ? error.error as Record<string, unknown> : {};
    const rawErrors = body['errors'] ?? body['validationErrors'];
    const validationErrors: Record<string, string[]> = {};

    if (rawErrors && typeof rawErrors === 'object') {
      for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
        validationErrors[key] = Array.isArray(value) ? value.map(String) : [String(value)];
      }
    }

    const message =
      this.text(body['message']) ??
      this.text(body['detail']) ??
      this.text(body['title']) ??
      (typeof error.error === 'string' ? error.error : null) ??
      error.message ??
      'An unexpected error occurred.';

    return {
      status: error.status,
      message,
      validationErrors,
      traceId: this.text(body['traceId']),
    };
  }

  private text(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }
}

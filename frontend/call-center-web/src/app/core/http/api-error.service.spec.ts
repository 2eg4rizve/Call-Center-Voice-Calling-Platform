import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService', () => {
  it('normalizes ASP.NET validation errors and trace ID', () => {
    const result = TestBed.inject(ApiErrorService).normalize(new HttpErrorResponse({
      status: 400,
      error: { title: 'Validation failed', errors: { Email: ['Invalid email'] }, traceId: 'trace-1' },
    }));
    expect(result).toEqual({ status: 400, message: 'Validation failed', validationErrors: { Email: ['Invalid email'] }, traceId: 'trace-1' });
  });

  it('uses API detail and custom validationErrors when provided', () => {
    const result = TestBed.inject(ApiErrorService).normalize(new HttpErrorResponse({
      status: 400,
      error: {
        title: 'Invalid request.',
        detail: 'Password must contain uppercase, lowercase, and a special character.',
        validationErrors: { Password: ['Password policy was not met.'] },
      },
    }));

    expect(result.message).toBe('Password must contain uppercase, lowercase, and a special character.');
    expect(result.validationErrors).toEqual({ Password: ['Password policy was not met.'] });
  });
});

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { NotificationService } from '../services/notification.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  const logout = vi.fn();
  const navigate = vi.fn();
  const show = vi.fn();

  beforeEach(() => {
    logout.mockReset(); navigate.mockReset(); show.mockReset();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting(),
      { provide: AuthStore, useValue: { logout } },
      { provide: Router, useValue: { url: '/agent/workspace', navigate } },
      { provide: NotificationService, useValue: { show } },
    ] });
  });

  it('clears auth and safely redirects on 401', () => {
    TestBed.inject(HttpClient).get('/api/private').subscribe({ error: (error) => expect(error.status).toBe(401) });
    TestBed.inject(HttpTestingController).expectOne('/api/private').flush({ message: 'Expired' }, { status: 401, statusText: 'Unauthorized' });
    expect(logout).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/agent/workspace' } });
  });

  it('preserves auth and redirects on 403', () => {
    TestBed.inject(HttpClient).get('/api/private').subscribe({ error: (error) => expect(error.status).toBe(403) });
    TestBed.inject(HttpTestingController).expectOne('/api/private').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(logout).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('shows normalized dependency errors globally', () => {
    TestBed.inject(HttpClient).get('/api/private').subscribe({ error: (error) => expect(error.status).toBe(503) });
    TestBed.inject(HttpTestingController).expectOne('/api/private').flush(
      { detail: 'The database did not respond in time. Please try again.' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    expect(show).toHaveBeenCalledWith('The database did not respond in time. Please try again.', 'error');
  });
});

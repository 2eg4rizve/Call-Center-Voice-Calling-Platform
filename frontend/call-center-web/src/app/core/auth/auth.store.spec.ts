import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../http/api-base-url.token';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  const navigate = vi.fn();
  let store: AuthStore;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    navigate.mockReset();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api' },
      { provide: Router, useValue: { navigate } },
    ] });
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores a successful login and clears it on logout', () => {
    store.login({ email: 'agent@example.com', password: 'secret' }).subscribe();
    const request = http.expectOne('/api/auth/login');
    request.flush({ accessToken: 'token', expiresAt: new Date(Date.now() + 60_000).toISOString(), userId: 'u1', displayName: 'Agent One', email: 'agent@example.com', role: 'Agent', agentId: 'a1' });

    expect(store.isAuthenticated()).toBe(true);
    expect(store.landingPage()).toBe('/agent/workspace');
    store.logout();
    expect(store.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});

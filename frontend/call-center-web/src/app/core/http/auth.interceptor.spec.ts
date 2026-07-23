import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../auth/auth.store';
import { API_BASE_URL } from './api-base-url.token';
import { authInterceptor } from './auth.interceptor';
import { HttpClient } from '@angular/common/http';

describe('authInterceptor', () => {
  it('adds the bearer token only to API requests and supports 204 responses', () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api' },
      { provide: AuthStore, useValue: { token: () => 'jwt-token' } },
    ] });
    const client = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    client.post('/api/agents/call-queues', {}).subscribe((result) => expect(result).toBeNull());
    const apiRequest = controller.expectOne('/api/agents/call-queues');
    expect(apiRequest.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    apiRequest.flush(null, { status: 204, statusText: 'No Content' });

    client.get('/assets/config.json').subscribe();
    const assetRequest = controller.expectOne('/assets/config.json');
    expect(assetRequest.request.headers.has('Authorization')).toBe(false);
    assetRequest.flush({});
    controller.verify();
  });
});

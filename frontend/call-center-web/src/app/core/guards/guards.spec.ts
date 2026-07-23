import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { landingGuard, roleGuard } from './role.guard';

describe('core guards', () => {
  const auth = { isAuthenticated: vi.fn(), hasRole: vi.fn(), landingPage: vi.fn() };
  const route = (data: Record<string, unknown> = {}) => ({ data }) as ActivatedRouteSnapshot;
  const state = { url: '/supervisor/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthStore, useValue: auth }] });
  });

  it('redirects unauthenticated users with a return URL', () => {
    auth.isAuthenticated.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard(route(), state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fsupervisor%2Fdashboard');
  });

  it('allows authenticated users through protected routes', () => {
    auth.isAuthenticated.mockReturnValue(true);
    expect(TestBed.runInInjectionContext(() => authGuard(route(), state))).toBe(true);
  });

  it('redirects unauthenticated role routes to login', () => {
    auth.isAuthenticated.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => roleGuard(route({ role: 'Agent' }), state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
    expect(auth.hasRole).not.toHaveBeenCalled();
  });

  it('allows authenticated users with the expected role', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.hasRole.mockReturnValue(true);
    expect(TestBed.runInInjectionContext(() => roleGuard(route({ role: 'Agent' }), state))).toBe(true);
    expect(auth.hasRole).toHaveBeenCalledWith('Agent');
  });

  it('prevents cross-role route access', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.hasRole.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => roleGuard(route({ role: 'Supervisor' }), state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/unauthorized');
  });

  it('redirects authenticated guests to their landing page', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.landingPage.mockReturnValue('/agent/workspace');
    const result = TestBed.runInInjectionContext(() => guestGuard(route(), state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/agent/workspace');
  });

  it('allows unauthenticated guests to open login', () => {
    auth.isAuthenticated.mockReturnValue(false);
    expect(TestBed.runInInjectionContext(() => guestGuard(route(), state))).toBe(true);
  });

  it('always resolves the root route to the current session landing page', () => {
    auth.landingPage.mockReturnValue('/supervisor/dashboard');
    const result = TestBed.runInInjectionContext(() => landingGuard(route(), state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/supervisor/dashboard');
  });
});

import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from '../api/services/auth-api.service';
import {
  AuthenticatedSession,
  isSafeReturnUrl,
  LoginRequest,
  LoginResponse,
  roleLandingPage,
  UserRole,
} from './auth.models';
import { SessionStorageService } from './session-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApiService);
  private readonly storage = inject(SessionStorageService);
  private readonly router = inject(Router);
  private readonly sessionState = signal<AuthenticatedSession | null>(this.storage.read());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.getValidSession() !== null);
  readonly role = computed(() => this.getValidSession()?.role ?? null);
  readonly displayName = computed(() => this.getValidSession()?.displayName ?? '');
  readonly email = computed(() => this.getValidSession()?.email ?? '');
  readonly agentId = computed(() => this.getValidSession()?.agentId ?? null);
  readonly token = computed(() => this.getValidSession()?.accessToken ?? null);
  readonly expiresAt = computed(() => this.getValidSession()?.expiresAt ?? null);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.api.login(request).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  logout(redirect = true): void {
    this.storage.clear();
    this.sessionState.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  landingPage(): string {
    const role = this.role();
    return role ? roleLandingPage(role) : '/login';
  }

  destinationAfterLogin(returnUrl: string | null): string {
    const role = this.role();
    if (!role) return '/login';
    return isSafeReturnUrl(returnUrl, role) ? returnUrl! : roleLandingPage(role);
  }

  hasRole(role: UserRole): boolean {
    return this.role() === role;
  }

  private setSession(response: LoginResponse): void {
    this.storage.write(response);
    this.sessionState.set(response);
  }

  private getValidSession(): AuthenticatedSession | null {
    const session = this.sessionState();
    if (session && Date.parse(session.expiresAt) <= Date.now()) {
      queueMicrotask(() => this.logout(false));
      return null;
    }
    return session;
  }
}

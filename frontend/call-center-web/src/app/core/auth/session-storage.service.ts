import { Injectable } from '@angular/core';
import { AuthenticatedSession, isUserRole } from './auth.models';

const SESSION_KEY = 'call-center.session';

@Injectable({ providedIn: 'root' })
export class SessionStorageService {
  read(): AuthenticatedSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      return this.isValid(value) ? value : null;
    } catch {
      return null;
    }
  }

  write(session: AuthenticatedSession): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }

  private isValid(value: unknown): value is AuthenticatedSession {
    if (!value || typeof value !== 'object') return false;
    const session = value as Record<string, unknown>;
    return (
      typeof session['accessToken'] === 'string' && session['accessToken'].length > 0 &&
      typeof session['expiresAt'] === 'string' && Number.isFinite(Date.parse(session['expiresAt'])) &&
      Date.parse(session['expiresAt']) > Date.now() &&
      typeof session['userId'] === 'string' &&
      typeof session['displayName'] === 'string' &&
      typeof session['email'] === 'string' &&
      isUserRole(session['role']) &&
      (typeof session['agentId'] === 'string' || session['agentId'] === null)
    );
  }
}

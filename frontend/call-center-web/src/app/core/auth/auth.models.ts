export type UserRole = 'Agent' | 'Supervisor';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  agentId: string | null;
}

export type AuthenticatedSession = LoginResponse;

export function isUserRole(value: unknown): value is UserRole {
  return value === 'Agent' || value === 'Supervisor';
}

export function roleLandingPage(role: UserRole): string {
  return role === 'Agent' ? '/agent/workspace' : '/supervisor/dashboard';
}

export function isSafeReturnUrl(url: string | null, role: UserRole): boolean {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.includes('://')) return false;
  if (role === 'Agent' && url.startsWith('/supervisor')) return false;
  if (role === 'Supervisor' && url.startsWith('/agent')) return false;
  return !['/login', '/unauthorized'].includes(url);
}

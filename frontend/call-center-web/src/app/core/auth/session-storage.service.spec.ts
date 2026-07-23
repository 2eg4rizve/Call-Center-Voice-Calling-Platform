import { TestBed } from '@angular/core/testing';
import { SessionStorageService } from './session-storage.service';

describe('SessionStorageService', () => {
  let service: SessionStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    service = TestBed.inject(SessionStorageService);
  });

  it('restores a structurally valid unexpired session', () => {
    const session = {
      accessToken: 'token', expiresAt: new Date(Date.now() + 60_000).toISOString(), userId: 'u1',
      displayName: 'Agent One', email: 'agent@example.com', role: 'Agent' as const, agentId: 'a1',
    };
    service.write(session);
    expect(service.read()).toEqual(session);
  });

  it('rejects malformed and expired sessions', () => {
    sessionStorage.setItem('call-center.session', '{bad json');
    expect(service.read()).toBeNull();
    service.write({ accessToken: 'x', expiresAt: new Date(0).toISOString(), userId: 'u', displayName: 'A', email: 'a@b.com', role: 'Agent', agentId: 'a' });
    expect(service.read()).toBeNull();
  });

  it('clears the stored session', () => {
    sessionStorage.setItem('call-center.session', '{}');
    service.clear();
    expect(sessionStorage.getItem('call-center.session')).toBeNull();
  });
});

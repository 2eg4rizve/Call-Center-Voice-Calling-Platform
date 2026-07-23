import { isSafeReturnUrl, roleLandingPage } from './auth.models';

describe('auth model helpers', () => {
  it('resolves role landing pages', () => {
    expect(roleLandingPage('Agent')).toBe('/agent/workspace');
    expect(roleLandingPage('Supervisor')).toBe('/supervisor/dashboard');
  });

  it('allows only local same-role return URLs', () => {
    expect(isSafeReturnUrl('/agent/history', 'Agent')).toBe(true);
    expect(isSafeReturnUrl('/supervisor/dashboard', 'Agent')).toBe(false);
    expect(isSafeReturnUrl('//evil.example', 'Agent')).toBe(false);
    expect(isSafeReturnUrl('https://evil.example', 'Supervisor')).toBe(false);
  });
});

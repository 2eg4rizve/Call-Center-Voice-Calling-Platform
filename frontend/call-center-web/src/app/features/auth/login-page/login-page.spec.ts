import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LoginResponse } from '../../../core/auth/auth.models';
import { AuthStore } from '../../../core/auth/auth.store';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const login = vi.fn();
  const destinationAfterLogin = vi.fn();
  const navigateByUrl = vi.fn();
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideNoopAnimations(),
        { provide: AuthStore, useValue: { login, destinationAfterLogin } },
        { provide: Router, useValue: { navigateByUrl } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => '/agent/history' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  function fill(email = 'agent1@callcenter.local', password = 'Demo@12345'): void {
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = email; inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = password; inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows required and invalid-email validation', () => {
    submit();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email address required.');
    fill('invalid', 'secret'); submit();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a valid email address.');
    expect(login).not.toHaveBeenCalled();
  });

  it('disables duplicate submission while login is pending', () => {
    const response = new Subject<LoginResponse>(); login.mockReturnValue(response);
    fill(); submit();
    expect((fixture.nativeElement.querySelector('.submit') as HTMLButtonElement).disabled).toBe(true);
    submit(); expect(login).toHaveBeenCalledOnce();
  });

  it('shows safe invalid-credential and unavailable-server errors', () => {
    let response = new Subject<LoginResponse>(); login.mockReturnValue(response); fill(); submit();
    response.error({ status: 401, validationErrors: {} }); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email or password is incorrect');

    response = new Subject<LoginResponse>(); login.mockReturnValue(response); submit();
    response.error({ status: 0, validationErrors: {} }); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unable to connect to the server');
  });

  it.each([
    ['/agent/workspace', 'Agent'],
    ['/supervisor/dashboard', 'Supervisor'],
  ])('redirects successful %s login safely', (destination, role) => {
    const response = new Subject<LoginResponse>(); login.mockReturnValue(response); destinationAfterLogin.mockReturnValue(destination);
    fill(); submit();
    response.next({ accessToken: 'token', expiresAt: new Date(Date.now() + 60_000).toISOString(), userId: 'u', displayName: `${role} Demo`, email: 'user@example.com', role: role as 'Agent' | 'Supervisor', agentId: role === 'Agent' ? 'a' : null });
    response.complete(); fixture.detectChanges();
    expect(destinationAfterLogin).toHaveBeenCalledWith('/agent/history');
    expect(navigateByUrl).toHaveBeenCalledWith(destination);
  });
});

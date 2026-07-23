import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiError } from '../../../core/http/api-error.model';
import { PendingButtonContent } from '../../../shared/components/pending-button/pending-button';
import { PendingActionDirective } from '../../../shared/directives/pending-action.directive';
import { applyServerValidationErrors } from '../../../shared/utils/server-validation.util';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, PendingActionDirective, PendingButtonContent, ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly pending = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.errorMessage.set(null);
    this.auth.login(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const destination = this.auth.destinationAfterLogin(this.route.snapshot.queryParamMap.get('returnUrl'));
        void this.router.navigateByUrl(destination);
      },
      error: (error: ApiError) => {
        this.pending.set(false);
        if (error.validationErrors) applyServerValidationErrors(this.form, error.validationErrors);
        this.errorMessage.set(error.status === 401
          ? 'Email ba password shothik noy. Abar check kore try korun.'
          : error.status === 0 || error.status >= 500
            ? 'Server-er sathe connect kora jacche na. Backend running ache kina check korun.'
            : 'Sign in complete kora jayni. Form-er information check korun.');
      },
    });
  }
}

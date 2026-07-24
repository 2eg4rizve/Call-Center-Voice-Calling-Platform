import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CustomerResponse } from '../../../core/api/models/customer.models';
import { CustomersApiService } from '../../../core/api/services/customers-api.service';
import { ApiError } from '../../../core/http/api-error.model';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PendingActionDirective } from '../../../shared/directives/pending-action.directive';
import { SnackbarNotificationService } from '../../../shared/services/snackbar-notification.service';
import { applyServerValidationErrors } from '../../../shared/utils/server-validation.util';
import { phoneNumberValidator } from '../../../shared/validators/phone-number.validator';

@Component({
  selector: 'app-customer-administration',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, NgTemplateOutlet, PageHeader, PendingActionDirective, ReactiveFormsModule],
  templateUrl: './customer-administration.html',
  styleUrl: './customer-administration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerAdministration {
  private readonly api = inject(CustomersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(SnackbarNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly customer = signal<CustomerResponse | null>(null);
  protected readonly customerPhone = signal('');
  protected readonly pending = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly notFound = signal(false);

  protected readonly lookupForm = new FormGroup({
    phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(30), phoneNumberValidator] }),
  });

  protected readonly createForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(30), phoneNumberValidator] }),
    emailAddress: new FormControl('', { nonNullable: true, validators: [Validators.email, Validators.maxLength(256)] }),
    customerCategory: new FormControl('', { nonNullable: true, validators: Validators.maxLength(100) }),
    recentInteractionSummary: new FormControl('', { nonNullable: true, validators: Validators.maxLength(1000) }),
  });

  protected readonly editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    emailAddress: new FormControl('', { nonNullable: true, validators: [Validators.email, Validators.maxLength(256)] }),
    customerCategory: new FormControl('', { nonNullable: true, validators: Validators.maxLength(100) }),
    recentInteractionSummary: new FormControl('', { nonNullable: true, validators: Validators.maxLength(1000) }),
  });

  constructor() {
    const customerId = this.route.snapshot.paramMap.get('customerId');
    if (customerId) this.loadById(customerId);
  }

  protected lookup(): void {
    this.clearFeedback();
    if (this.lookupForm.invalid || this.pending()) {
      this.lookupForm.markAllAsTouched();
      this.message.set('Enter a valid phone number, for example: +8801712345678.');
      return;
    }
    const phone = this.lookupForm.controls.phoneNumber.value.trim();
    this.pending.set(true);
    this.api.lookup(phone).pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (customer) => this.showCustomer(customer, phone),
      error: (error: ApiError) => {
        if (error.status === 404) {
          this.notFound.set(true);
          this.createForm.controls.phoneNumber.setValue(phone);
          this.message.set('No customer was found for this phone number. Use the form below to create one.');
          return;
        }
        this.handleError(this.lookupForm, error, 'Unable to look up the customer.');
      },
    });
  }

  protected create(): void {
    this.clearFeedback();
    if (this.createForm.invalid || this.pending()) {
      this.createForm.markAllAsTouched();
      this.message.set('Complete the required fields and correct the highlighted validation errors.');
      return;
    }
    const value = this.createForm.getRawValue();
    this.pending.set(true);
    this.api.create({
      name: value.name.trim(), phoneNumber: value.phoneNumber.trim(),
      emailAddress: this.optional(value.emailAddress), customerCategory: this.optional(value.customerCategory),
      recentInteractionSummary: this.optional(value.recentInteractionSummary),
    }).pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (customer) => {
        this.showCustomer(customer, value.phoneNumber.trim());
        this.notify.show('Customer created successfully.');
        void this.router.navigate(['/supervisor/customers', customer.id], { replaceUrl: true });
      },
      error: (error: ApiError) => this.handleError(this.createForm, error, 'Unable to create the customer.'),
    });
  }

  protected update(): void {
    const customer = this.customer();
    this.message.set(null);
    if (!customer || this.editForm.invalid || this.pending()) {
      this.editForm.markAllAsTouched();
      this.message.set('Complete the required fields and correct the highlighted validation errors.');
      return;
    }
    const value = this.editForm.getRawValue();
    this.pending.set(true);
    this.api.update(customer.id, {
      name: value.name.trim(), emailAddress: this.optional(value.emailAddress),
      customerCategory: this.optional(value.customerCategory), recentInteractionSummary: this.optional(value.recentInteractionSummary),
    }).pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => { this.showCustomer(updated, this.customerPhone()); this.notify.show('Customer updated successfully.'); },
      error: (error: ApiError) => this.handleError(this.editForm, error, 'Unable to update the customer.'),
    });
  }

  protected startCreate(): void {
    this.customer.set(null);
    this.notFound.set(false);
    this.message.set(null);
    this.createForm.reset({ name: '', phoneNumber: this.lookupForm.controls.phoneNumber.value, emailAddress: '', customerCategory: '', recentInteractionSummary: '' });
  }

  private loadById(customerId: string): void {
    this.clearFeedback();
    this.pending.set(true);
    this.api.get(customerId).pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (customer) => this.showCustomer(customer, ''),
      error: (error: ApiError) => { this.notFound.set(error.status === 404); this.message.set(error.status === 404 ? 'The customer was not found.' : error.message); },
    });
  }

  private showCustomer(customer: CustomerResponse, phone: string): void {
    this.customer.set(customer);
    this.customerPhone.set(phone);
    this.notFound.set(false);
    this.message.set(null);
    this.editForm.reset({ name: customer.name, emailAddress: customer.emailAddress ?? '', customerCategory: customer.customerCategory ?? '', recentInteractionSummary: customer.recentInteractionSummary ?? '' });
  }

  private handleError(form: FormGroup, error: ApiError, fallback: string): void {
    applyServerValidationErrors(form, error.validationErrors);
    this.message.set(error.message || fallback);
  }

  private clearFeedback(): void { this.message.set(null); this.notFound.set(false); }
  private optional(value: string): string | null { return value.trim() || null; }
}

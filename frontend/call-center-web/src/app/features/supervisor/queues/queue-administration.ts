import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize, filter, switchMap } from 'rxjs';
import { CallQueueResponse } from '../../../core/api/models/queue.models';
import { CallQueuesApiService } from '../../../core/api/services/call-queues-api.service';
import { ApiError } from '../../../core/http/api-error.model';
import { FeedbackStateComponent } from '../../../shared/components/feedback-state/feedback-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PendingActionDirective } from '../../../shared/directives/pending-action.directive';
import { ResponsiveTable } from '../../../shared/components/responsive-table/responsive-table';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { SnackbarNotificationService } from '../../../shared/services/snackbar-notification.service';
import { applyServerValidationErrors } from '../../../shared/utils/server-validation.util';

@Component({
  selector: 'app-queue-administration',
  imports: [FeedbackStateComponent, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, NgTemplateOutlet, PageHeader, PendingActionDirective, ReactiveFormsModule, ResponsiveTable, StatusChip],
  templateUrl: './queue-administration.html',
  styleUrl: './queue-administration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueAdministration {
  private readonly api = inject(CallQueuesApiService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly notify = inject(SnackbarNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly queues = signal<CallQueueResponse[]>([]);
  protected readonly selected = signal<CallQueueResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly createForm = this.queueForm();
  protected readonly editForm = this.queueForm();

  constructor() { this.load(); }

  protected load(): void {
    this.loading.set(true); this.loadError.set(false);
    this.api.listActive().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (queues) => this.queues.set(queues),
      error: () => this.loadError.set(true),
    });
  }

  protected create(): void {
    this.formError.set(null);
    if (this.createForm.invalid || this.pending()) {
      this.createForm.markAllAsTouched();
      this.formError.set('Queue name ebong highlighted validation message-gulo check korun.');
      return;
    }
    const value = this.createForm.getRawValue();
    this.pending.set(true);
    this.api.create({ name: value.name.trim(), description: this.optional(value.description) })
      .pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.createForm.reset({ name: '', description: '' }); this.notify.show('Queue created successfully.'); this.load(); },
        error: (error: ApiError) => this.handleError(this.createForm, error, 'Queue create kora jayni.'),
      });
  }

  protected choose(queue: CallQueueResponse): void {
    this.selected.set(queue); this.formError.set(null);
    this.editForm.reset({ name: queue.name, description: queue.description ?? '' });
  }

  protected cancelEdit(): void { this.selected.set(null); this.formError.set(null); }

  protected update(): void {
    const queue = this.selected(); this.formError.set(null);
    if (!queue || this.editForm.invalid || this.pending()) {
      this.editForm.markAllAsTouched(); this.formError.set('Queue name ebong highlighted validation message-gulo check korun.'); return;
    }
    const value = this.editForm.getRawValue(); this.pending.set(true);
    this.api.update(queue.id, { name: value.name.trim(), description: this.optional(value.description), isActive: true })
      .pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.notify.show('Queue updated successfully.'); this.selected.set(null); this.load(); },
        error: (error: ApiError) => this.handleError(this.editForm, error, 'Queue update kora jayni.'),
      });
  }

  protected deactivate(): void {
    const queue = this.selected();
    if (!queue || this.pending()) return;
    this.confirmation.confirm({
      title: `Deactivate ${queue.name}?`,
      message: 'Queue-ti active list theke disappear korbe. Current API inactive queue list ba reactivate support kore na, tai ei UI theke abar active kora jabe na.',
      confirmLabel: 'Deactivate queue', destructive: true,
    }).pipe(
      filter((confirmed) => confirmed === true),
      switchMap(() => {
        this.pending.set(true); this.formError.set(null);
        const value = this.editForm.getRawValue();
        return this.api.update(queue.id, { name: value.name.trim(), description: this.optional(value.description), isActive: false })
          .pipe(finalize(() => this.pending.set(false)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.queues.update((queues) => queues.filter((item) => item.id !== queue.id));
        this.selected.set(null); this.notify.show('Queue deactivated.');
      },
      error: (error: ApiError) => this.handleError(this.editForm, error, 'Queue deactivate kora jayni.'),
    });
  }

  private queueForm(): FormGroup<{ name: FormControl<string>; description: FormControl<string> }> {
    return new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
      description: new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) }),
    });
  }
  private handleError(form: FormGroup, error: ApiError, fallback: string): void {
    applyServerValidationErrors(form, error.validationErrors); this.formError.set(error.message || fallback);
  }
  private optional(value: string): string | null { return value.trim() || null; }
}

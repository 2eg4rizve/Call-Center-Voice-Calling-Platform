import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { catchError, distinctUntilChanged, EMPTY, exhaustMap, filter, finalize, forkJoin, fromEvent, map, merge, NEVER, startWith, Subject, switchMap, tap, timer } from 'rxjs';
import { CallQueueResponse } from '../../../core/api/models/queue.models';
import { CallResponse } from '../../../core/api/models/call.models';
import { AgentStatusSummaryResponse, DashboardMetricsResponse, OperationalCallsResponse } from '../../../core/api/models/dashboard.models';
import { CallQueuesApiService } from '../../../core/api/services/call-queues-api.service';
import { CallsApiService } from '../../../core/api/services/calls-api.service';
import { CustomersApiService } from '../../../core/api/services/customers-api.service';
import { DashboardApiService } from '../../../core/api/services/dashboard-api.service';
import { ApiError } from '../../../core/http/api-error.model';
import { FeedbackStateComponent } from '../../../shared/components/feedback-state/feedback-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PendingActionDirective } from '../../../shared/directives/pending-action.directive';
import { ResponsiveTable } from '../../../shared/components/responsive-table/responsive-table';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { LocalDateTimePipe } from '../../../shared/pipes/local-date-time.pipe';
import { SnackbarNotificationService } from '../../../shared/services/snackbar-notification.service';
import { phoneNumberValidator } from '../../../shared/validators/phone-number.validator';

type CallerMode = 'known' | 'unknown';
interface DashboardSnapshot { metrics: DashboardMetricsResponse; agents: AgentStatusSummaryResponse; calls: OperationalCallsResponse }

@Component({
  selector: 'app-supervisor-dashboard',
  imports: [DurationPipe, FeedbackStateComponent, LocalDateTimePipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatSelectModule, PageHeader, PendingActionDirective, ReactiveFormsModule, ResponsiveTable, StatusChip],
  templateUrl: './supervisor-dashboard.html', styleUrl: './supervisor-dashboard.scss', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupervisorDashboard {
  private readonly dashboardApi = inject(DashboardApiService); private readonly queuesApi = inject(CallQueuesApiService);
  private readonly callsApi = inject(CallsApiService); private readonly customersApi = inject(CustomersApiService);
  private readonly notify = inject(SnackbarNotificationService); private readonly destroyRef = inject(DestroyRef);
  private readonly refreshTrigger = new Subject<void>();
  private readonly pollingIntervalMs = 5000;
  private readonly maximumPollingDelayMs = 60000;
  private pollingFailureCount = 0;
  private nextAutomaticPollAt = 0;

  protected readonly snapshot = signal<DashboardSnapshot | null>(null); protected readonly queues = signal<CallQueueResponse[]>([]);
  protected readonly loading = signal(true); protected readonly loadError = signal(false); protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null); protected readonly createdCall = signal<CallResponse | null>(null);
  protected readonly assigningCallId = signal<string | null>(null);
  protected readonly callForm = new FormGroup({
    mode: new FormControl<CallerMode>('known', { nonNullable: true }),
    phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(30), phoneNumberValidator] }),
    callQueueId: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  constructor() {
    this.queuesApi.listActive().pipe(takeUntilDestroyed()).subscribe({ next: (queues) => this.queues.set(queues), error: () => this.formError.set('Unable to load active queues.') });
    const visibility = fromEvent(document, 'visibilitychange').pipe(startWith(null), map(() => !document.hidden), distinctUntilChanged());
    const automaticRefresh = timer(0, this.pollingIntervalMs).pipe(map(() => false));
    const manualRefresh = this.refreshTrigger.pipe(map(() => true));
    visibility.pipe(
      switchMap((visible) => visible ? merge(automaticRefresh, manualRefresh) : NEVER),
      filter((manual) => manual || Date.now() >= this.nextAutomaticPollAt),
      exhaustMap(() => this.fetchDashboard().pipe(
        tap(() => this.resetPollingBackoff()),
        catchError(() => { this.increasePollingBackoff(); this.loadError.set(true); this.loading.set(false); return EMPTY; }),
      )),
      takeUntilDestroyed(),
    ).subscribe((snapshot) => { this.snapshot.set(snapshot); this.loadError.set(false); this.loading.set(false); });
  }

  protected retry(): void { this.loading.set(true); this.loadError.set(false); this.refreshTrigger.next(); }

  protected createCall(): void {
    this.formError.set(null); this.createdCall.set(null);
    if (this.callForm.invalid || this.pending()) { this.callForm.markAllAsTouched(); this.formError.set('Enter a valid phone number and select an active queue.'); return; }
    const value = this.callForm.getRawValue(); const phone = value.phoneNumber.trim(); this.pending.set(true);
    const request = value.mode === 'known'
      ? this.customersApi.lookup(phone).pipe(switchMap((customer) => this.callsApi.create({ customerId: customer.id, callerPhoneNumber: null, callQueueId: value.callQueueId })))
      : this.callsApi.create({ customerId: null, callerPhoneNumber: phone, callQueueId: value.callQueueId });
    request.pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (call) => { this.createdCall.set(call); this.notify.show('Inbound call created.'); this.refreshTrigger.next(); },
      error: (error: ApiError) => this.formError.set(value.mode === 'known' && error.status === 404 ? 'No known customer was found for this phone number. Create the customer or use Unknown caller mode.' : (error.message || 'Unable to create the call.')),
    });
  }

  protected assign(call: CallResponse): void {
    if (this.assigningCallId() || call.status !== 'Waiting') return;
    this.assigningCallId.set(call.id);
    this.callsApi.assign(call.id).pipe(finalize(() => this.assigningCallId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (assigned) => {
        this.notify.show(assigned ? `Call assigned to ${assigned.assignedAgentName ?? 'an eligible agent'}.` : 'No eligible agent is currently available.');
        this.refreshTrigger.next();
      },
      error: (error: ApiError) => {
        this.notify.show(error.status === 409 ? 'Call state changed. Refreshing the dashboard.' : (error.message || 'Unable to assign the call.'));
        if (error.status === 409) this.refreshTrigger.next();
      },
    });
  }

  private increasePollingBackoff(): void { this.pollingFailureCount += 1; const delay = Math.min(this.pollingIntervalMs * (2 ** this.pollingFailureCount), this.maximumPollingDelayMs); this.nextAutomaticPollAt = Date.now() + delay; }
  private resetPollingBackoff(): void { this.pollingFailureCount = 0; this.nextAutomaticPollAt = 0; }
  private fetchDashboard() { return forkJoin({ metrics: this.dashboardApi.metrics(), agents: this.dashboardApi.agents(), calls: this.dashboardApi.calls() }); }
}

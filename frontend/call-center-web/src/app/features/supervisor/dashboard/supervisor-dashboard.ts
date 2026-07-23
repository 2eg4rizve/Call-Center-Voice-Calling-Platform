import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { catchError, distinctUntilChanged, EMPTY, exhaustMap, finalize, forkJoin, fromEvent, map, merge, NEVER, startWith, Subject, switchMap, timer } from 'rxjs';
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
    this.queuesApi.listActive().pipe(takeUntilDestroyed()).subscribe({ next: (queues) => this.queues.set(queues), error: () => this.formError.set('Active queue load kora jayni.') });
    const visibility = fromEvent(document, 'visibilitychange').pipe(startWith(null), map(() => !document.hidden), distinctUntilChanged());
    visibility.pipe(
      switchMap((visible) => visible ? merge(timer(0, 5000), this.refreshTrigger) : NEVER),
      exhaustMap(() => this.fetchDashboard().pipe(catchError(() => { this.loadError.set(true); this.loading.set(false); return EMPTY; }))),
      takeUntilDestroyed(),
    ).subscribe((snapshot) => { this.snapshot.set(snapshot); this.loadError.set(false); this.loading.set(false); });
  }

  protected retry(): void { this.loading.set(true); this.loadError.set(false); this.refreshTrigger.next(); }

  protected createCall(): void {
    this.formError.set(null); this.createdCall.set(null);
    if (this.callForm.invalid || this.pending()) { this.callForm.markAllAsTouched(); this.formError.set('Valid phone number ar active queue select korun.'); return; }
    const value = this.callForm.getRawValue(); const phone = value.phoneNumber.trim(); this.pending.set(true);
    const request = value.mode === 'known'
      ? this.customersApi.lookup(phone).pipe(switchMap((customer) => this.callsApi.create({ customerId: customer.id, callerPhoneNumber: null, callQueueId: value.callQueueId })))
      : this.callsApi.create({ customerId: null, callerPhoneNumber: phone, callQueueId: value.callQueueId });
    request.pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (call) => { this.createdCall.set(call); this.notify.show('Inbound call created.'); this.refreshTrigger.next(); },
      error: (error: ApiError) => this.formError.set(value.mode === 'known' && error.status === 404 ? 'Ei phone number-e known customer pawa jayni. Customer create korun ba Unknown caller mode use korun.' : (error.message || 'Call create kora jayni.')),
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
        this.notify.show(error.status === 409 ? 'Call state changed. Dashboard refresh kora hocche.' : (error.message || 'Call assign kora jayni.'));
        if (error.status === 409) this.refreshTrigger.next();
      },
    });
  }

  private fetchDashboard() { return forkJoin({ metrics: this.dashboardApi.metrics(), agents: this.dashboardApi.agents(), calls: this.dashboardApi.calls() }); }
}

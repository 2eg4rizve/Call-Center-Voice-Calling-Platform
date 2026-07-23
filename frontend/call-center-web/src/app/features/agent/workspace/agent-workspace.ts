import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { catchError, EMPTY, exhaustMap, filter, finalize, fromEvent, startWith, timer } from 'rxjs';
import { AgentsApiService } from '../../../core/api/services/agents-api.service';
import { CallsApiService } from '../../../core/api/services/calls-api.service';
import { AgentResponse } from '../../../core/api/models/agent.models';
import { CallResponse } from '../../../core/api/models/call.models';
import { AgentStatus, CallOutcome } from '../../../core/api/models/enums';
import { AuthStore } from '../../../core/auth/auth.store';
import { FeedbackStateComponent } from '../../../shared/components/feedback-state/feedback-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PendingActionDirective } from '../../../shared/directives/pending-action.directive';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { LocalDateTimePipe } from '../../../shared/pipes/local-date-time.pipe';

@Component({ selector: 'app-agent-workspace', imports: [FeedbackStateComponent, LocalDateTimePipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeader, PendingActionDirective, ReactiveFormsModule, StatusChip], templateUrl: './agent-workspace.html', styleUrl: './agent-workspace.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AgentWorkspace {
  private readonly agents = inject(AgentsApiService); private readonly calls = inject(CallsApiService); private readonly auth = inject(AuthStore); private readonly destroyRef = inject(DestroyRef);
  protected readonly profile = signal<AgentResponse | null>(null); protected readonly currentCall = signal<CallResponse | null>(null);
  protected readonly loading = signal(true); protected readonly error = signal<string | null>(null); protected readonly pending = signal(false);
  protected readonly statusOptions: AgentStatus[] = ['Available', 'OnBreak', 'Offline'];
  protected readonly outcomes: CallOutcome[] = ['Resolved', 'FollowUpRequired', 'Escalated', 'NoAnswer', 'WrongNumber'];
  protected readonly outcome = new FormControl<CallOutcome | null>(null, Validators.required);
  protected readonly notes = new FormControl('', { nonNullable: true, validators: Validators.maxLength(2000) });

  constructor() {
    this.loadProfile();
    fromEvent(document, 'visibilitychange').pipe(startWith(null), exhaustMap(() => timer(0, 3000)), filter(() => !document.hidden && this.auth.isAuthenticated()), exhaustMap(() => this.calls.current().pipe(catchError(() => EMPTY))), takeUntilDestroyed()).subscribe((call) => { this.currentCall.set(call); this.loading.set(false); });
  }
  protected loadProfile(): void { this.agents.current().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (p) => { this.profile.set(p); this.error.set(null); }, error: () => this.error.set('Agent profile load kora jayni.') }); }
  protected changeStatus(status: AgentStatus): void { if (this.pending() || this.currentCall()) return; this.pending.set(true); this.agents.updateStatus({ status }).pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.loadProfile(), error: () => this.error.set('Status update kora jayni.') }); }
  protected accept(): void { const call = this.currentCall(); if (!call || call.status !== 'Assigned' || this.pending()) return; this.pending.set(true); this.calls.accept(call.id).pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({ next: (updated) => { this.currentCall.set(updated); this.loadProfile(); }, error: () => this.error.set('Call-ti ar accept kora jacche na. Current state refresh hobe.') }); }
  protected complete(): void { const call = this.currentCall(); if (!call || this.outcome.invalid || this.notes.invalid || this.pending()) { this.outcome.markAsTouched(); return; } this.pending.set(true); this.calls.complete(call.id, { outcome: this.outcome.value!, notes: this.notes.value.trim() || null }).pipe(finalize(() => this.pending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.currentCall.set(null); this.outcome.reset(); this.notes.reset(''); this.loadProfile(); }, error: () => this.error.set('Call complete kora jayni. Notes preserve kora hoyeche; abar try korun.') }); }
}

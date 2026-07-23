import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { CallResponse } from '../../../core/api/models/call.models';
import { DashboardMetricsResponse } from '../../../core/api/models/dashboard.models';
import { CallQueuesApiService } from '../../../core/api/services/call-queues-api.service';
import { CallsApiService } from '../../../core/api/services/calls-api.service';
import { CustomersApiService } from '../../../core/api/services/customers-api.service';
import { DashboardApiService } from '../../../core/api/services/dashboard-api.service';
import { SnackbarNotificationService } from '../../../shared/services/snackbar-notification.service';
import { SupervisorDashboard } from './supervisor-dashboard';

describe('SupervisorDashboard', () => {
  const metrics = vi.fn(); const agents = vi.fn(); const dashboardCalls = vi.fn(); const listActive = vi.fn();
  const lookup = vi.fn(); const create = vi.fn(); const assign = vi.fn(); const show = vi.fn();
  let fixture: ComponentFixture<SupervisorDashboard>;

  const metricData: DashboardMetricsResponse = { totalAgents: 4, availableAgents: 2, busyAgents: 1, onBreakAgents: 1, offlineAgents: 0, waitingCalls: 1, assignedCalls: 0, activeCalls: 1, completedCallsToday: 8, averageCompletedCallDurationSeconds: 125 };
  const waitingCall: CallResponse = { id: 'call-1', callReferenceNumber: 'CALL-000001', direction: 'Inbound', status: 'Waiting', customer: null, callQueueId: 'queue-1', callQueueName: 'Support', assignedAgentId: null, assignedAgentName: null, createdAtUtc: '2026-07-23T12:00:00Z', assignedAtUtc: null, acceptedAtUtc: null, completedAtUtc: null, outcome: null, notes: null, crmSyncStatus: 'Pending', durationSeconds: null };

  beforeEach(async () => {
    vi.clearAllMocks();
    metrics.mockReturnValue(of(metricData));
    agents.mockReturnValue(of({ agents: [{ id: 'agent-1', displayName: 'Agent One', status: 'Available', lastAvailableAtUtc: '2026-07-23T12:00:00Z', callQueueNames: ['Support'], currentCallId: null, currentCallReference: null }] }));
    dashboardCalls.mockReturnValue(of({ waitingCalls: [waitingCall], activeCalls: [] }));
    listActive.mockReturnValue(of([{ id: 'queue-1', name: 'Support', description: null, isActive: true }]));
    await TestBed.configureTestingModule({
      imports: [SupervisorDashboard], providers: [provideNoopAnimations(),
        { provide: DashboardApiService, useValue: { metrics, agents, calls: dashboardCalls } },
        { provide: CallQueuesApiService, useValue: { listActive } },
        { provide: CustomersApiService, useValue: { lookup } },
        { provide: CallsApiService, useValue: { create, assign } },
        { provide: SnackbarNotificationService, useValue: { show } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SupervisorDashboard); fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();
  });

  function setValue(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value; input.dispatchEvent(new Event('input')); fixture.detectChanges();
  }

  function submitCall(): void { (fixture.nativeElement.querySelector('aside form') as HTMLFormElement).dispatchEvent(new Event('submit')); fixture.detectChanges(); }

  it('renders combined metrics, waiting calls, and Agent status', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Completed Today'); expect(text).toContain('CALL-000001'); expect(text).toContain('Agent One');
    expect(metrics).toHaveBeenCalledOnce(); expect(agents).toHaveBeenCalledOnce(); expect(dashboardCalls).toHaveBeenCalledOnce();
  });

  it('looks up known customers and submits only customerId', () => {
    lookup.mockReturnValue(of({ id: 'customer-1', customerReferenceNumber: 'CUS-1', name: 'Demo', emailAddress: null, customerCategory: null, recentInteractionSummary: null, isKnownCustomer: true }));
    const response = new Subject<CallResponse>(); create.mockReturnValue(response);
    setValue('aside input[formControlName="phoneNumber"]', '+8801712345678');
    const select = fixture.nativeElement.querySelector('mat-select') as HTMLElement; select.dispatchEvent(new Event('focus'));
    fixture.componentInstance['callForm'].controls.callQueueId.setValue('queue-1'); submitCall();
    expect(create).toHaveBeenCalledWith({ customerId: 'customer-1', callerPhoneNumber: null, callQueueId: 'queue-1' });
    response.next(waitingCall); response.complete(); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('CALL-000001'); expect(metrics).toHaveBeenCalledTimes(2);
  });

  it('submits only callerPhoneNumber in unknown mode', () => {
    fixture.componentInstance['callForm'].controls.mode.setValue('unknown');
    fixture.componentInstance['callForm'].controls.callQueueId.setValue('queue-1');
    create.mockReturnValue(of(waitingCall)); setValue('aside input[formControlName="phoneNumber"]', '+8801812345678'); submitCall();
    expect(lookup).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({ customerId: null, callerPhoneNumber: '+8801812345678', callQueueId: 'queue-1' });
  });

  it('handles no eligible Agent and refreshes stale assignment conflicts', () => {
    assign.mockReturnValueOnce(of({ ...waitingCall, status: 'Assigned', assignedAgentId: 'agent-1', assignedAgentName: 'Agent One' }));
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(show).toHaveBeenCalledWith('Call assigned to Agent One.'); expect(metrics).toHaveBeenCalledTimes(2);

    assign.mockReturnValueOnce(of(null));
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(show).toHaveBeenCalledWith('No eligible agent is currently available.'); expect(metrics).toHaveBeenCalledTimes(3);

    assign.mockReturnValueOnce(throwError(() => ({ status: 409, message: 'Conflict', validationErrors: {}, traceId: null })));
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(show).toHaveBeenCalledWith('Call state changed. Dashboard refresh kora hocche.'); expect(metrics).toHaveBeenCalledTimes(4);
  });

  it('pauses while hidden, refreshes immediately when visible, polls, and stops after destroy', async () => {
    let hidden = true;
    const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.useFakeTimers();
    document.dispatchEvent(new Event('visibilitychange'));
    const beforeVisible = metrics.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(metrics).toHaveBeenCalledTimes(beforeVisible);

    hidden = false; document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(metrics).toHaveBeenCalledTimes(beforeVisible + 1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(metrics).toHaveBeenCalledTimes(beforeVisible + 2);

    fixture.destroy(); await vi.advanceTimersByTimeAsync(5000);
    expect(metrics).toHaveBeenCalledTimes(beforeVisible + 2);
    hiddenSpy.mockRestore(); vi.useRealTimers();
  });
});

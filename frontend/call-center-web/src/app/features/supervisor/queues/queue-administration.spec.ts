import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { CallQueueResponse } from '../../../core/api/models/queue.models';
import { CallQueuesApiService } from '../../../core/api/services/call-queues-api.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { SnackbarNotificationService } from '../../../shared/services/snackbar-notification.service';
import { QueueAdministration } from './queue-administration';

describe('QueueAdministration', () => {
  const listActive = vi.fn(); const create = vi.fn(); const update = vi.fn();
  const confirm = vi.fn(); const show = vi.fn();
  const queue: CallQueueResponse = { id: '54230557-6afb-42a6-8579-b517fe42bb28', name: 'Customer Support', description: 'General calls', isActive: true };
  let fixture: ComponentFixture<QueueAdministration>;

  beforeEach(async () => {
    vi.clearAllMocks(); listActive.mockReturnValue(of([queue])); confirm.mockReturnValue(of(true));
    await TestBed.configureTestingModule({
      imports: [QueueAdministration], providers: [provideNoopAnimations(),
        { provide: CallQueuesApiService, useValue: { listActive, create, update } },
        { provide: ConfirmationService, useValue: { confirm } },
        { provide: SnackbarNotificationService, useValue: { show } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(QueueAdministration); fixture.detectChanges();
  });

  function setValue(selector: string, value: string): void {
    const control = fixture.nativeElement.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    control.value = value; control.dispatchEvent(new Event('input')); fixture.detectChanges();
  }

  it('loads the active responsive queue list and documents inactive limitations', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(listActive).toHaveBeenCalledOnce(); expect(text).toContain('Customer Support');
    expect(text).toContain('General calls'); expect(text).toContain('reactivation endpoint dey na');
  });

  it('validates and creates a queue, then refreshes the list', () => {
    const form = fixture.nativeElement.querySelector('aside form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit')); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Queue name required.');
    setValue('aside input[formControlName="name"]', 'Priority Support');
    setValue('aside textarea[formControlName="description"]', 'Priority calls');
    const response = new Subject<CallQueueResponse>(); create.mockReturnValue(response);
    form.dispatchEvent(new Event('submit'));
    response.next({ ...queue, name: 'Priority Support' }); response.complete(); fixture.detectChanges();
    expect(create).toHaveBeenCalledWith({ name: 'Priority Support', description: 'Priority calls' });
    expect(listActive).toHaveBeenCalledTimes(2); expect(show).toHaveBeenCalledWith('Queue created successfully.');
  });

  it('edits only supported queue fields and keeps it active', () => {
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click(); fixture.detectChanges();
    setValue('aside input[formControlName="name"]', 'Updated Support');
    const response = new Subject<CallQueueResponse>(); update.mockReturnValue(response);
    (fixture.nativeElement.querySelector('aside form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    response.next({ ...queue, name: 'Updated Support' }); response.complete(); fixture.detectChanges();
    expect(update).toHaveBeenCalledWith(queue.id, { name: 'Updated Support', description: 'General calls', isActive: true });
    expect(listActive).toHaveBeenCalledTimes(2);
  });

  it('requires confirmation and removes a deactivated queue from the active list', () => {
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click(); fixture.detectChanges();
    const response = new Subject<CallQueueResponse>(); update.mockReturnValue(response);
    (fixture.nativeElement.querySelector('.danger') as HTMLButtonElement).click();
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
    expect(update).toHaveBeenCalledWith(queue.id, { name: queue.name, description: queue.description, isActive: false });
    response.next({ ...queue, isActive: false }); response.complete(); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('General calls');
    expect(show).toHaveBeenCalledWith('Queue deactivated.');
  });
});

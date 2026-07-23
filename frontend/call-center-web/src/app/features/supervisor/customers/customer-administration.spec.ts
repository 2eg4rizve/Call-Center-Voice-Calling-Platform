import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CustomerResponse } from '../../../core/api/models/customer.models';
import { CustomersApiService } from '../../../core/api/services/customers-api.service';
import { SnackbarNotificationService } from '../../../shared/services/snackbar-notification.service';
import { CustomerAdministration } from './customer-administration';

describe('CustomerAdministration', () => {
  const lookup = vi.fn();
  const get = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const navigate = vi.fn();
  const show = vi.fn();
  let fixture: ComponentFixture<CustomerAdministration>;

  const customer: CustomerResponse = {
    id: '4dfe7b6f-ffb3-48e5-95d6-d786510fb078', customerReferenceNumber: 'CUS-123456789012',
    name: 'Demo Customer', emailAddress: 'demo@example.com', customerCategory: 'Priority',
    recentInteractionSummary: 'Requested a follow-up.', isKnownCustomer: true,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CustomerAdministration],
      providers: [
        provideNoopAnimations(),
        { provide: CustomersApiService, useValue: { lookup, get, create, update } },
        { provide: Router, useValue: { navigate } },
        { provide: SnackbarNotificationService, useValue: { show } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerAdministration);
    fixture.detectChanges();
  });

  function setValue(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('validates lookup and displays a found customer', () => {
    const lookupForm = fixture.nativeElement.querySelector('.lookup') as HTMLFormElement;
    lookupForm.dispatchEvent(new Event('submit')); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Phone number required.');

    const response = new Subject<CustomerResponse>(); lookup.mockReturnValue(response);
    setValue('.lookup input', '+8801712345678'); lookupForm.dispatchEvent(new Event('submit'));
    response.next(customer); response.complete(); fixture.detectChanges();

    expect(lookup).toHaveBeenCalledWith('+8801712345678');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('CUS-123456789012');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Requested a follow-up.');
  });

  it('turns a not-found lookup into a prefilled create workflow', () => {
    const response = new Subject<CustomerResponse>(); lookup.mockReturnValue(response);
    setValue('.lookup input', '+8801712345678');
    (fixture.nativeElement.querySelector('.lookup') as HTMLFormElement).dispatchEvent(new Event('submit'));
    response.error({ status: 404, message: 'Not found', validationErrors: {}, traceId: null }); fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('kono customer pawa jayni');
    expect((fixture.nativeElement.querySelector('aside input[formControlName="phoneNumber"]') as HTMLInputElement).value).toBe('+8801712345678');
  });

  it('creates a customer with null optional values and enables update', () => {
    const createResponse = new Subject<CustomerResponse>(); create.mockReturnValue(createResponse);
    setValue('aside input[formControlName="phoneNumber"]', '+8801712345678');
    setValue('aside input[formControlName="name"]', 'Demo Customer');
    (fixture.nativeElement.querySelector('aside form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    createResponse.next(customer); createResponse.complete(); fixture.detectChanges();

    expect(create).toHaveBeenCalledWith({ name: 'Demo Customer', phoneNumber: '+8801712345678', emailAddress: null, customerCategory: null, recentInteractionSummary: null });
    expect(navigate).toHaveBeenCalledWith(['/supervisor/customers', customer.id], { replaceUrl: true });

    const updateResponse = new Subject<CustomerResponse>(); update.mockReturnValue(updateResponse);
    setValue('aside input[formControlName="name"]', 'Updated Customer');
    (fixture.nativeElement.querySelector('aside form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    updateResponse.next({ ...customer, name: 'Updated Customer' }); updateResponse.complete(); fixture.detectChanges();
    expect(update).toHaveBeenCalledWith(customer.id, expect.objectContaining({ name: 'Updated Customer' }));
  });

  it('blocks invalid email and backend maximum lengths before create', () => {
    setValue('aside input[formControlName="phoneNumber"]', '+8801712345678');
    setValue('aside input[formControlName="name"]', 'x'.repeat(201));
    setValue('aside input[formControlName="emailAddress"]', 'invalid-email');
    setValue('aside input[formControlName="customerCategory"]', 'x'.repeat(101));
    setValue('aside textarea[formControlName="recentInteractionSummary"]', 'x'.repeat(1001));
    (fixture.nativeElement.querySelector('aside form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Maximum 200 characters allowed.');
    expect(text).toContain('Valid email din');
    expect(text).toContain('Maximum 100 characters allowed.');
    expect(text).toContain('Maximum 1000 characters allowed.');
    expect(create).not.toHaveBeenCalled();
  });
});

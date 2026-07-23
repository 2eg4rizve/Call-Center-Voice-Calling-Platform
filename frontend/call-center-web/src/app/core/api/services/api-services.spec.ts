import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../http/api-base-url.token';
import { AgentsApiService } from './agents-api.service';
import { AuthApiService } from './auth-api.service';
import { CallQueuesApiService } from './call-queues-api.service';
import { CallsApiService } from './calls-api.service';
import { CustomersApiService } from './customers-api.service';
import { DashboardApiService } from './dashboard-api.service';

describe('API services', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends the auth login contract', () => {
    const body = { email: 'agent@example.com', password: 'secret' };
    TestBed.inject(AuthApiService).login(body).subscribe();
    const request = http.expectOne('/api/auth/login'); expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual(body); request.flush({});
  });

  it('covers every agent endpoint including the 204 queue assignment', () => {
    const api = TestBed.inject(AgentsApiService);
    api.list().subscribe(); let request = http.expectOne('/api/agents'); expect(request.request.method).toBe('GET'); request.flush([]);
    api.current().subscribe(); request = http.expectOne('/api/agents/me'); request.flush({});
    const create = { fullName: 'Agent', email: 'a@b.com', password: 'password', displayName: 'Agent' };
    api.create(create).subscribe(); request = http.expectOne('/api/agents'); expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual(create); request.flush({});
    api.update('agent-id', { displayName: 'Updated' }).subscribe(); request = http.expectOne('/api/agents/agent-id'); expect(request.request.method).toBe('PUT'); request.flush({});
    api.updateStatus({ status: 'OnBreak' }).subscribe(); request = http.expectOne('/api/agents/me/status'); expect(request.request.method).toBe('PATCH'); expect(request.request.body.status).toBe('OnBreak'); request.flush({});
    api.assignToQueue({ agentId: 'a', callQueueId: 'q' }).subscribe((value) => expect(value).toBeNull()); request = http.expectOne('/api/agents/call-queues'); expect(request.request.method).toBe('POST'); request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('covers queue CRUD contracts', () => {
    const api = TestBed.inject(CallQueuesApiService);
    api.listActive().subscribe(); let request = http.expectOne('/api/call-queues'); expect(request.request.method).toBe('GET'); request.flush([]);
    api.create({ name: 'Sales', description: null }).subscribe(); request = http.expectOne('/api/call-queues'); expect(request.request.method).toBe('POST'); request.flush({});
    const body = { name: 'Sales', description: 'Updated', isActive: false };
    api.update('queue-id', body).subscribe(); request = http.expectOne('/api/call-queues/queue-id'); expect(request.request.body).toEqual(body); request.flush({});
  });

  it('covers customer lookup and mutation contracts', () => {
    const api = TestBed.inject(CustomersApiService);
    api.lookup('+8801712345678').subscribe(); let request = http.expectOne((value) => value.url === '/api/customers/lookup'); expect(request.request.params.get('phoneNumber')).toBe('+8801712345678'); request.flush({});
    api.get('customer-id').subscribe(); request = http.expectOne('/api/customers/customer-id'); request.flush({});
    const create = { name: 'Customer', phoneNumber: '+8801712345678', emailAddress: null, customerCategory: null, recentInteractionSummary: null };
    api.create(create).subscribe(); request = http.expectOne('/api/customers'); expect(request.request.body).toEqual(create); request.flush({});
    const update = { name: 'Updated', emailAddress: null, customerCategory: 'VIP', recentInteractionSummary: null };
    api.update('customer-id', update).subscribe(); request = http.expectOne('/api/customers/customer-id'); expect(request.request.method).toBe('PUT'); expect(request.request.body).toEqual(update); request.flush({});
  });

  it('covers call workflow, optional filters, enums, GUID paths, UTC dates, and nullable 204 results', () => {
    const api = TestBed.inject(CallsApiService);
    const create = { customerId: null, callerPhoneNumber: '+8801712345678', callQueueId: 'queue-guid' };
    api.create(create).subscribe(); let request = http.expectOne('/api/calls'); expect(request.request.body).toEqual(create); request.flush({});
    api.waiting().subscribe(); request = http.expectOne('/api/calls/waiting'); request.flush([]);
    api.current().subscribe((value) => expect(value).toBeNull()); request = http.expectOne('/api/calls/current'); request.flush(null, { status: 204, statusText: 'No Content' });
    api.assign('call-guid').subscribe((value) => expect(value).toBeNull()); request = http.expectOne('/api/calls/call-guid/assign'); expect(request.request.method).toBe('POST'); request.flush(null, { status: 204, statusText: 'No Content' });
    api.accept('call-guid').subscribe(); request = http.expectOne('/api/calls/call-guid/accept'); request.flush({});
    api.complete('call-guid', { outcome: 'Resolved', notes: null }).subscribe(); request = http.expectOne('/api/calls/call-guid/complete'); expect(request.request.body.outcome).toBe('Resolved'); request.flush({});
    const fromDateUtc = '2026-07-23T00:00:00.000Z';
    api.history({ page: 2, status: 'Completed', fromDateUtc, customerSearch: '' }).subscribe(); request = http.expectOne((value) => value.url === '/api/calls/history'); expect(request.request.params.get('page')).toBe('2'); expect(request.request.params.get('status')).toBe('Completed'); expect(request.request.params.get('fromDateUtc')).toBe(fromDateUtc); expect(request.request.params.has('customerSearch')).toBe(false); request.flush({ items: [], totalCount: 0, page: 2, pageSize: 20, totalPages: 0 });
    api.details('call-guid').subscribe(); request = http.expectOne('/api/calls/call-guid'); expect(request.request.method).toBe('GET'); request.flush({});
  });

  it('covers all dashboard read endpoints', () => {
    const api = TestBed.inject(DashboardApiService);
    api.metrics().subscribe(); let request = http.expectOne('/api/dashboard/metrics'); request.flush({});
    api.agents().subscribe(); request = http.expectOne('/api/dashboard/agents'); request.flush({ agents: [] });
    api.calls().subscribe(); request = http.expectOne('/api/dashboard/calls'); request.flush({ waitingCalls: [], activeCalls: [] });
  });
});

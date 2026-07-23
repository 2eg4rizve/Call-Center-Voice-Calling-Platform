import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { CallDetailsResponse } from '../../core/api/models/call.models';
import { CallsApiService } from '../../core/api/services/calls-api.service';
import { AuthStore } from '../../core/auth/auth.store';
import { CallDetails } from './call-details';

describe('CallDetails',()=>{
 const details=vi.fn();let response:Subject<CallDetailsResponse>;let fixture:ComponentFixture<CallDetails>;
 beforeEach(async()=>{response=new Subject();details.mockReturnValue(response);await TestBed.configureTestingModule({imports:[CallDetails],providers:[provideNoopAnimations(),{provide:CallsApiService,useValue:{details}},{provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=> 'call-1'}}}},{provide:AuthStore,useValue:{role:()=> 'Supervisor'}}]}).compileComponents();fixture=TestBed.createComponent(CallDetails);fixture.detectChanges()});
 it('sorts events and renders nullable metadata safely',()=>{const call={id:'call-1',callReferenceNumber:'CALL-1',direction:'Inbound',status:'Completed',customer:null,callQueueId:'q1',callQueueName:'Support',assignedAgentId:null,assignedAgentName:null,createdAtUtc:'2026-07-01T00:00:00Z',assignedAtUtc:null,acceptedAtUtc:null,completedAtUtc:null,outcome:null,notes:null,crmSyncStatus:'Pending',durationSeconds:null,events:[{id:'e2',eventType:'Completed',eventAtUtc:'2026-07-02T00:00:00Z',details:null},{id:'e1',eventType:'Created',eventAtUtc:'2026-07-01T00:00:00Z',details:'Created'}]} as CallDetailsResponse;response.next(call);response.complete();fixture.detectChanges();const text=(fixture.nativeElement as HTMLElement).textContent;const timeline=(fixture.nativeElement.querySelector('.timeline') as HTMLElement).textContent;expect(text).toContain('Unknown caller');expect(text).toContain('Unassigned');expect(timeline.indexOf('Created')).toBeLessThan(timeline.indexOf('Completed'))});
 it.each([[401,'Sign-in required'],[403,'Access denied'],[404,'Call not found']] as const)('shows distinct %s state',(status,title)=>{response.error({status,message:'error',validationErrors:{},traceId:null});fixture.detectChanges();expect((fixture.nativeElement as HTMLElement).textContent).toContain(title)});
});

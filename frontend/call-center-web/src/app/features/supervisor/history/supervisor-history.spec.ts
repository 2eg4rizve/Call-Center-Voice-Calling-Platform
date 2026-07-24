import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AgentsApiService } from '../../../core/api/services/agents-api.service';
import { CallsApiService } from '../../../core/api/services/calls-api.service';
import { SupervisorHistory } from './supervisor-history';

describe('SupervisorHistory',()=>{
 const history=vi.fn();let fixture:ComponentFixture<SupervisorHistory>;
 beforeEach(async()=>{history.mockReturnValue(of({items:[],totalCount:0,page:1,pageSize:20,totalPages:0}));await TestBed.configureTestingModule({imports:[SupervisorHistory],providers:[provideNoopAnimations(),{provide:CallsApiService,useValue:{history}},{provide:AgentsApiService,useValue:{list:()=>of([{id:'a1',displayName:'Agent One',status:'Available',lastAvailableAtUtc:null,currentCallReference:null,callQueueNames:['Support']}])}}]}).compileComponents();fixture=TestBed.createComponent(SupervisorHistory);fixture.detectChanges()});
 it('loads Supervisor Agent options and applies UTC filters on page one',()=>{const form=fixture.componentInstance['filters'];form.setValue({agentId:'a1',customerSearch:' Demo ',status:'Completed',outcome:'Resolved',from:'2026-07-01',to:'2026-07-02',pageSize:50});(fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));expect(history).toHaveBeenLastCalledWith(expect.objectContaining({page:1,pageSize:50,agentId:'a1',customerSearch:'Demo',status:'Completed',outcome:'Resolved',fromDateUtc:expect.any(String),toDateUtc:expect.any(String)}));expect((fixture.nativeElement as HTMLElement).textContent).toContain('Agent One')});
 it('uses server pagination and clears every filter',()=>{fixture.componentInstance['load'](3);expect(history).toHaveBeenLastCalledWith(expect.objectContaining({page:3}));fixture.componentInstance['filters'].controls.customerSearch.setValue('Demo');fixture.componentInstance['clear']();expect(fixture.componentInstance['filters'].controls.customerSearch.value).toBe('');expect(history).toHaveBeenLastCalledWith(expect.objectContaining({page:1,agentId:null,status:null,outcome:null}))});
});

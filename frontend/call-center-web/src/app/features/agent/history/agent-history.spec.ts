import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CallsApiService } from '../../../core/api/services/calls-api.service';
import { AgentHistory } from './agent-history';

describe('AgentHistory',()=>{const history=vi.fn();beforeEach(async()=>{history.mockReturnValue(of({items:[],totalCount:0,page:1,pageSize:20,totalPages:0}));await TestBed.configureTestingModule({imports:[AgentHistory],providers:[provideNoopAnimations(),{provide:CallsApiService,useValue:{history}}]}).compileComponents()});it('uses role-restricted filters without Agent selector and supports pagination',()=>{const fixture=TestBed.createComponent(AgentHistory);fixture.detectChanges();expect(fixture.nativeElement.querySelector('select[formControlName="agentId"]')).toBeNull();fixture.componentInstance['filters'].patchValue({customerSearch:'Demo',status:'Completed',outcome:'Resolved',from:'2026-07-01',to:'2026-07-02',pageSize:50});fixture.componentInstance['load'](3);expect(history).toHaveBeenLastCalledWith(expect.objectContaining({page:3,pageSize:50,customerSearch:'Demo',status:'Completed',outcome:'Resolved',fromDateUtc:expect.any(String),toDateUtc:expect.any(String)}))})});

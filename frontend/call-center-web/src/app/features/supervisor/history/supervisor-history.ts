import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AgentSummaryResponse } from '../../../core/api/models/agent.models';
import { CallHistoryResponse, PagedResponse } from '../../../core/api/models/call.models';
import { CallOutcome, CallStatus } from '../../../core/api/models/enums';
import { AgentsApiService } from '../../../core/api/services/agents-api.service';
import { CallsApiService } from '../../../core/api/services/calls-api.service';
import { FeedbackStateComponent } from '../../../shared/components/feedback-state/feedback-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { ResponsiveTable } from '../../../shared/components/responsive-table/responsive-table';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { LocalDateTimePipe } from '../../../shared/pipes/local-date-time.pipe';
import { localDateToUtcIso } from '../../../shared/utils/date-filter.util';

@Component({ selector:'app-supervisor-history', imports:[DurationPipe,FeedbackStateComponent,LocalDateTimePipe,PageHeader,Pagination,ReactiveFormsModule,ResponsiveTable,RouterLink,StatusChip], templateUrl:'./supervisor-history.html',styleUrl:'./supervisor-history.scss',changeDetection:ChangeDetectionStrategy.OnPush })
export class SupervisorHistory {
  private readonly calls=inject(CallsApiService);private readonly agentsApi=inject(AgentsApiService);private readonly destroyRef=inject(DestroyRef);
  protected readonly result=signal<PagedResponse<CallHistoryResponse>|null>(null);protected readonly agents=signal<AgentSummaryResponse[]>([]);protected readonly loading=signal(true);protected readonly error=signal(false);
  protected readonly statuses:CallStatus[]=['Waiting','Assigned','Active','Completed','Missed','Cancelled'];protected readonly outcomes:CallOutcome[]=['Resolved','FollowUpRequired','Escalated','NoAnswer','WrongNumber'];
  protected readonly filters=new FormGroup({agentId:new FormControl<string|null>(null),customerSearch:new FormControl(''),status:new FormControl<CallStatus|null>(null),outcome:new FormControl<CallOutcome|null>(null),from:new FormControl(''),to:new FormControl(''),pageSize:new FormControl(20,{nonNullable:true})});
  constructor(){this.agentsApi.list().pipe(takeUntilDestroyed()).subscribe({next:a=>this.agents.set(a)});this.load(1)}
  protected load(page=1):void{this.loading.set(true);this.error.set(false);const f=this.filters.getRawValue();this.calls.history({page,pageSize:f.pageSize,agentId:f.agentId,customerSearch:f.customerSearch?.trim()||null,status:f.status,outcome:f.outcome,fromDateUtc:localDateToUtcIso(f.from),toDateUtc:localDateToUtcIso(f.to,true)}).pipe(finalize(()=>this.loading.set(false)),takeUntilDestroyed(this.destroyRef)).subscribe({next:r=>this.result.set(r),error:()=>this.error.set(true)})}
  protected clear():void{this.filters.reset({agentId:null,customerSearch:'',status:null,outcome:null,from:'',to:'',pageSize:20});this.load(1)}
}

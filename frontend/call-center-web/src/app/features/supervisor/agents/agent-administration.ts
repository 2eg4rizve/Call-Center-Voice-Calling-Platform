import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import { AgentSummaryResponse } from '../../../core/api/models/agent.models';
import { CallQueueResponse } from '../../../core/api/models/queue.models';
import { AgentsApiService } from '../../../core/api/services/agents-api.service';
import { CallQueuesApiService } from '../../../core/api/services/call-queues-api.service';
import { ApiError } from '../../../core/http/api-error.model';
import { FeedbackStateComponent } from '../../../shared/components/feedback-state/feedback-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PendingActionDirective } from '../../../shared/directives/pending-action.directive';
import { ResponsiveTable } from '../../../shared/components/responsive-table/responsive-table';
import { StatusChip } from '../../../shared/components/status-chip/status-chip';
import { LocalDateTimePipe } from '../../../shared/pipes/local-date-time.pipe';
import { SnackbarNotificationService } from '../../../shared/services/snackbar-notification.service';
import { applyServerValidationErrors } from '../../../shared/utils/server-validation.util';

@Component({ selector:'app-agent-administration', imports:[FeedbackStateComponent,LocalDateTimePipe,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,PageHeader,PendingActionDirective,ReactiveFormsModule,ResponsiveTable,StatusChip], templateUrl:'./agent-administration.html', styleUrl:'./agent-administration.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class AgentAdministration {
  private readonly api=inject(AgentsApiService);private readonly queuesApi=inject(CallQueuesApiService);private readonly notify=inject(SnackbarNotificationService);private readonly destroyRef=inject(DestroyRef);
  protected readonly agents=signal<AgentSummaryResponse[]>([]);protected readonly queues=signal<CallQueueResponse[]>([]);protected readonly loading=signal(true);protected readonly error=signal(false);protected readonly pending=signal(false);protected readonly selected=signal<AgentSummaryResponse|null>(null);
  protected readonly formError=signal<string|null>(null);
  protected readonly createForm=new FormGroup({fullName:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(150)]}),displayName:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(150)]}),email:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.email,Validators.maxLength(256)]}),password:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.minLength(8),Validators.maxLength(100),Validators.pattern(/[a-z]/),Validators.pattern(/[A-Z]/),Validators.pattern(/[^a-zA-Z0-9]/)]})});
  protected readonly editForm=new FormGroup({displayName:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(150)]})});
  protected readonly assignmentForm=new FormGroup({agentId:new FormControl('',{nonNullable:true,validators:Validators.required}),callQueueId:new FormControl('',{nonNullable:true,validators:Validators.required})});
  constructor(){this.load();}
  protected load():void{this.loading.set(true);this.error.set(false);forkJoin({agents:this.api.list(),queues:this.queuesApi.listActive()}).pipe(finalize(()=>this.loading.set(false)),takeUntilDestroyed(this.destroyRef)).subscribe({next:r=>{this.agents.set(r.agents);this.queues.set(r.queues)},error:()=>this.error.set(true)});}
  protected create():void{this.formError.set(null);if(this.createForm.invalid||this.pending()){this.createForm.markAllAsTouched();this.formError.set('Complete all required fields correctly.');return}this.pending.set(true);this.api.create(this.createForm.getRawValue()).pipe(finalize(()=>this.pending.set(false)),takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.createForm.reset({fullName:'',displayName:'',email:'',password:''});this.notify.show('Agent created successfully.');this.load()},error:(e:ApiError)=>{this.createForm.controls.password.reset('');if(e.validationErrors)applyServerValidationErrors(this.createForm,e.validationErrors);this.formError.set(e.message||'Unable to create the agent. Check the form and try again.')}});}
  protected choose(agent:AgentSummaryResponse):void{this.selected.set(agent);this.editForm.setValue({displayName:agent.displayName});this.assignmentForm.controls.agentId.setValue(agent.id);}
  protected update():void{const agent=this.selected();this.formError.set(null);if(!agent||this.editForm.invalid||this.pending()){this.editForm.markAllAsTouched();this.formError.set('Enter a valid display name.');return}this.pending.set(true);this.api.update(agent.id,this.editForm.getRawValue()).pipe(finalize(()=>this.pending.set(false)),takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.notify.show('Agent name updated.');this.selected.set(null);this.load()},error:(e:ApiError)=>{if(e.validationErrors)applyServerValidationErrors(this.editForm,e.validationErrors);this.formError.set(e.message||'Unable to update the agent.')}});}
  protected assign():void{this.formError.set(null);if(this.assignmentForm.invalid||this.pending()){this.assignmentForm.markAllAsTouched();this.formError.set('Select a queue for this assignment.');return}this.pending.set(true);this.api.assignToQueue(this.assignmentForm.getRawValue()).pipe(finalize(()=>this.pending.set(false)),takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>this.notify.show('Queue assignment saved. Existing assignments remain unchanged.'),error:(e:ApiError)=>this.formError.set(e.message||'Queue assignment failed.')});}
}

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CallDetailsResponse } from '../../core/api/models/call.models';
import { CallsApiService } from '../../core/api/services/calls-api.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ApiError } from '../../core/http/api-error.model';
import { FeedbackStateComponent } from '../../shared/components/feedback-state/feedback-state';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatusChip } from '../../shared/components/status-chip/status-chip';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { LocalDateTimePipe } from '../../shared/pipes/local-date-time.pipe';

@Component({selector:'app-call-details',imports:[DurationPipe,FeedbackStateComponent,LocalDateTimePipe,MatButtonModule,PageHeader,RouterLink,StatusChip],templateUrl:'./call-details.html',styleUrl:'./call-details.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class CallDetails{
 private readonly api=inject(CallsApiService);private readonly route=inject(ActivatedRoute);private readonly auth=inject(AuthStore);private readonly destroyRef=inject(DestroyRef);
 protected readonly details=signal<CallDetailsResponse|null>(null);protected readonly loading=signal(true);protected readonly status=signal<number|null>(null);protected readonly backLink=computed(()=>this.auth.role()==='Supervisor'?'/supervisor/history':'/agent/history');protected readonly events=computed(()=>[...(this.details()?.events??[])].sort((a,b)=>Date.parse(a.eventAtUtc)-Date.parse(b.eventAtUtc)));
 constructor(){this.load()}
 protected load():void{const id=this.route.snapshot.paramMap.get('id');if(!id){this.status.set(404);this.loading.set(false);return}this.loading.set(true);this.status.set(null);this.api.details(id).pipe(finalize(()=>this.loading.set(false)),takeUntilDestroyed(this.destroyRef)).subscribe({next:d=>this.details.set(d),error:(e:ApiError)=>this.status.set(e.status)})}
}

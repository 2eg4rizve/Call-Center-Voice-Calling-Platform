import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../http/api-base-url.token';
import { AgentStatusSummaryResponse, DashboardMetricsResponse, OperationalCallsResponse } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient); private readonly url = `${inject(API_BASE_URL)}/dashboard`;
  metrics(): Observable<DashboardMetricsResponse> { return this.http.get<DashboardMetricsResponse>(`${this.url}/metrics`); }
  agents(): Observable<AgentStatusSummaryResponse> { return this.http.get<AgentStatusSummaryResponse>(`${this.url}/agents`); }
  calls(): Observable<OperationalCallsResponse> { return this.http.get<OperationalCallsResponse>(`${this.url}/calls`); }
}

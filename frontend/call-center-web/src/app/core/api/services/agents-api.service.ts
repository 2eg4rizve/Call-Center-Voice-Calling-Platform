import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../http/api-base-url.token';
import { AgentResponse, AgentSummaryResponse, AssignAgentToCallQueueRequest, CreateAgentRequest, UpdateAgentRequest, UpdateAgentStatusRequest } from '../models/agent.models';

@Injectable({ providedIn: 'root' })
export class AgentsApiService {
  private readonly http = inject(HttpClient); private readonly url = `${inject(API_BASE_URL)}/agents`;
  list(): Observable<AgentSummaryResponse[]> { return this.http.get<AgentSummaryResponse[]>(this.url); }
  current(): Observable<AgentResponse> { return this.http.get<AgentResponse>(`${this.url}/me`); }
  create(request: CreateAgentRequest): Observable<AgentResponse> { return this.http.post<AgentResponse>(this.url, request); }
  update(agentId: string, request: UpdateAgentRequest): Observable<AgentResponse> { return this.http.put<AgentResponse>(`${this.url}/${encodeURIComponent(agentId)}`, request); }
  updateStatus(request: UpdateAgentStatusRequest): Observable<AgentResponse> { return this.http.patch<AgentResponse>(`${this.url}/me/status`, request); }
  assignToQueue(request: AssignAgentToCallQueueRequest): Observable<void> { return this.http.post<void>(`${this.url}/call-queues`, request); }
}

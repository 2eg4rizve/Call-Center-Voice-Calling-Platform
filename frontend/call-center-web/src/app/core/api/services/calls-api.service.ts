import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../http/api-base-url.token';
import { toHttpParams } from '../../../shared/utils/query-params.util';
import { CallDetailsResponse, CallHistoryRequest, CallHistoryResponse, CallResponse, CompleteCallRequest, CreateCallRequest, PagedResponse } from '../models/call.models';

@Injectable({ providedIn: 'root' })
export class CallsApiService {
  private readonly http = inject(HttpClient); private readonly url = `${inject(API_BASE_URL)}/calls`;
  create(request: CreateCallRequest): Observable<CallResponse> { return this.http.post<CallResponse>(this.url, request); }
  waiting(): Observable<CallResponse[]> { return this.http.get<CallResponse[]>(`${this.url}/waiting`); }
  current(): Observable<CallResponse | null> { return this.http.get<CallResponse | null>(`${this.url}/current`); }
  assign(callId: string): Observable<CallResponse | null> { return this.http.post<CallResponse | null>(`${this.url}/${encodeURIComponent(callId)}/assign`, null); }
  assignToAgent(callId: string, agentId: string): Observable<CallResponse> { return this.http.post<CallResponse>(`${this.url}/${encodeURIComponent(callId)}/assign/${encodeURIComponent(agentId)}`, null); }
  accept(callId: string): Observable<CallResponse> { return this.http.post<CallResponse>(`${this.url}/${encodeURIComponent(callId)}/accept`, null); }
  complete(callId: string, request: CompleteCallRequest): Observable<CallResponse> { return this.http.post<CallResponse>(`${this.url}/${encodeURIComponent(callId)}/complete`, request); }
  history(filters: CallHistoryRequest = {}): Observable<PagedResponse<CallHistoryResponse>> {
    return this.http.get<PagedResponse<CallHistoryResponse>>(`${this.url}/history`, { params: toHttpParams({ ...filters }) });
  }
  details(callId: string): Observable<CallDetailsResponse> { return this.http.get<CallDetailsResponse>(`${this.url}/${encodeURIComponent(callId)}`); }
}

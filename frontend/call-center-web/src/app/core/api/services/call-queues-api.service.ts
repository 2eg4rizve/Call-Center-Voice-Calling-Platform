import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../http/api-base-url.token';
import { CallQueueResponse, CreateCallQueueRequest, UpdateCallQueueRequest } from '../models/queue.models';

@Injectable({ providedIn: 'root' })
export class CallQueuesApiService {
  private readonly http = inject(HttpClient); private readonly url = `${inject(API_BASE_URL)}/call-queues`;
  listActive(): Observable<CallQueueResponse[]> { return this.http.get<CallQueueResponse[]>(this.url); }
  create(request: CreateCallQueueRequest): Observable<CallQueueResponse> { return this.http.post<CallQueueResponse>(this.url, request); }
  update(queueId: string, request: UpdateCallQueueRequest): Observable<CallQueueResponse> { return this.http.put<CallQueueResponse>(`${this.url}/${encodeURIComponent(queueId)}`, request); }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../http/api-base-url.token';
import { CreateCustomerRequest, CustomerResponse, UpdateCustomerRequest } from '../models/customer.models';

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient); private readonly url = `${inject(API_BASE_URL)}/customers`;
  lookup(phoneNumber: string): Observable<CustomerResponse> { return this.http.get<CustomerResponse>(`${this.url}/lookup`, { params: new HttpParams().set('phoneNumber', phoneNumber) }); }
  get(customerId: string): Observable<CustomerResponse> { return this.http.get<CustomerResponse>(`${this.url}/${encodeURIComponent(customerId)}`); }
  create(request: CreateCustomerRequest): Observable<CustomerResponse> { return this.http.post<CustomerResponse>(this.url, request); }
  update(customerId: string, request: UpdateCustomerRequest): Observable<CustomerResponse> { return this.http.put<CustomerResponse>(`${this.url}/${encodeURIComponent(customerId)}`, request); }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../auth/auth.models';
import { API_BASE_URL } from '../../http/api-base-url.token';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient); private readonly baseUrl = inject(API_BASE_URL);
  login(request: LoginRequest): Observable<LoginResponse> { return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, request); }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../http/api-url';
import { silentErrors } from '../http/http-context';
import { CreateUserRequest, UpdateUserRequest, User } from '../models';

/** UserController: /api/users (solo ADMIN). */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/users');

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.base, request, { context: silentErrors() });
  }

  update(id: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}`, request, { context: silentErrors() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

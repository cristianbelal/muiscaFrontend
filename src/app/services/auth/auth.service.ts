import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/auth/login'; // URL del endpoint
  private apiValidation= 'http://localhost:8080/auth/validate'; // URL del endpoint de validación
  private apiDelete = 'http://localhost:8080/auth/delete'; // URL del endpoint de eliminación
  private apiUpdate = 'http://localhost:8080/api/users/3'; // URL del endpoint de actualización

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(this.apiUrl, credentials);
  }
  validateUser(token: string): Observable<any> {
  return this.http.get(this.apiValidation, {
    headers: { Authorization: `Bearer ${token}` }
  });
  }
  deleteUser(token: String): Observable<any> {
    return this.http.delete(this.apiValidation, {
      headers: { Authorization: `Bearer ${token}` }
    })
  };
  updateUser(token: String, userData: any): Observable<any> {
    return this.http.put(this.apiUpdate, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }



}

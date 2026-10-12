import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../http/api-url';
import { silentErrors } from '../http/http-context';

/** AccountController: /api/account (autogestión de la propia cuenta). */
@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/account');

  /** @param currentPassword null si la cuenta solo entra con Google (aún no tiene contraseña) */
  changePassword(currentPassword: string | null, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.base}/password`, { currentPassword, newPassword }, { context: silentErrors() });
  }

  /** Elimina la cuenta con su historial y su biblioteca de modelos. */
  deleteAccount(password: string | null): Observable<void> {
    return this.http.delete<void>(this.base, { body: { password }, context: silentErrors() });
  }
}

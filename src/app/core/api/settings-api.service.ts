import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import { apiUrl } from '../http/api-url';
import { SILENT_ERRORS, SKIP_SESSION_EXPIRED, silentErrors } from '../http/http-context';
import { PublicSettings, SettingsRequest, SystemSettings } from '../models';

const DEFAULT_PUBLIC: PublicSettings = { registrationEnabled: true, announcement: null };

/** SettingsController: /api/settings (configuración del sistema). */
@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/settings');

  /**
   * Configuración pública (sin sesión). Si el backend no responde se asumen los valores por
   * defecto para no bloquear la pantalla de acceso.
   */
  publicSettings(): Observable<PublicSettings> {
    const context = new HttpContext().set(SILENT_ERRORS, true).set(SKIP_SESSION_EXPIRED, true);
    return this.http.get<PublicSettings>(`${this.base}/public`, { context }).pipe(
      catchError(() => of(DEFAULT_PUBLIC)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  get(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(this.base);
  }

  update(request: SettingsRequest): Observable<SystemSettings> {
    return this.http.put<SystemSettings>(this.base, request, { context: silentErrors() });
  }
}

import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap, throwError } from 'rxjs';
import { apiUrl } from '../http/api-url';
import { SILENT_ERRORS, SKIP_SESSION_EXPIRED } from '../http/http-context';
import { NotificationService } from '../notifications/notification.service';
import { AuthResponse, CATALOG_MANAGER_ROLES, Role, User } from '../models';
import { TokenStorage } from './token-storage.service';

/** Ruta a la que se llega tras iniciar sesión. */
export const HOME_URL = '/inicio';

/**
 * Sesión del usuario. El backend es la fuente de verdad del rol: tras obtener el JWT se
 * consulta GET /auth/validate, igual que hace JwtAuthenticationFilter al leer el rol de la BD.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenStorage);
  private readonly notifications = inject(NotificationService);

  private readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly role = computed<Role | null>(() => this.currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly canManageCatalog = computed(() => this.hasAnyRole(CATALOG_MANAGER_ROLES));

  hasAnyRole(roles: readonly Role[] | undefined): boolean {
    const role = this.role();
    return !roles || roles.length === 0 || (role !== null && roles.includes(role));
  }

  /** true si el usuario actual creó el recurso o es administrador (Permissions.requireOwnerOrAdmin). */
  canModify(createdBy: string): boolean {
    return this.isAdmin() || this.currentUser()?.username === createdBy;
  }

  login(username: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(apiUrl('/auth/login'), { username, password }, { context: authContext() })
      .pipe(switchMap(({ token }) => this.startSession(token)));
  }

  /** @param credential ID token emitido por Google Identity Services */
  loginWithGoogle(credential: string): Observable<User> {
    return this.http
      .post<AuthResponse>(apiUrl('/oauth/google'), { value: credential }, { context: authContext() })
      .pipe(switchMap(({ token }) => this.startSession(token)));
  }

  /** El auto-registro siempre crea cuentas USER; luego se inicia sesión con las mismas credenciales. */
  register(username: string, password: string): Observable<User> {
    return this.http
      .post<User>(apiUrl('/auth/register'), { username, password }, { context: authContext() })
      .pipe(switchMap(() => this.login(username, password)));
  }

  /** Se ejecuta al arrancar la app: si hay un token guardado, recupera el usuario. */
  restoreSession(): Observable<User | null> {
    if (!this.tokens.get()) {
      return of(null);
    }
    return this.fetchCurrentUser().pipe(
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  /** Vuelve a leer el usuario (por ejemplo, si un administrador cambió su rol). */
  refreshProfile(): Observable<User> {
    return this.fetchCurrentUser();
  }

  logout(): void {
    this.clearSession();
    this.router.navigateByUrl('/login');
  }

  /** Lo invoca el interceptor de errores ante un 401 de una ruta protegida. */
  handleSessionExpired(): void {
    if (!this.tokens.get() && !this.currentUser()) {
      return;
    }
    const returnUrl = this.router.url.startsWith('/login') ? undefined : this.router.url;
    this.clearSession();
    this.notifications.info('Su sesión expiró. Inicie sesión de nuevo para continuar.');
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  private startSession(token: string): Observable<User> {
    this.tokens.set(token);
    return this.fetchCurrentUser().pipe(
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  private fetchCurrentUser(): Observable<User> {
    return this.http
      .get<User>(apiUrl('/auth/validate'), { context: authContext() })
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  private clearSession(): void {
    this.tokens.clear();
    this.currentUser.set(null);
  }
}

/** Las pantallas de acceso muestran sus errores en línea y un 401 ahí no es "sesión vencida". */
function authContext(): HttpContext {
  return new HttpContext().set(SILENT_ERRORS, true).set(SKIP_SESSION_EXPIRED, true);
}

/** Acepta solo rutas internas para evitar redirecciones abiertas a otros dominios. */
export function safeReturnUrl(url: string | null | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : HOME_URL;
}

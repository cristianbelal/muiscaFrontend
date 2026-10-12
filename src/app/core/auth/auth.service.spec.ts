import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { errorInterceptor } from '../http/error.interceptor';
import { User } from '../models';
import { authInterceptor } from './auth.interceptor';
import { AuthService, safeReturnUrl } from './auth.service';
import { TokenStorage } from './token-storage.service';

const ADMIN: User = { id: 1, username: 'admin', role: 'ADMIN', localAccount: true };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokens: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorage);
    tokens.clear();
  });

  afterEach(() => {
    http.verify();
    tokens.clear();
  });

  it('inicia sesión, guarda el JWT y toma el rol de /auth/validate', () => {
    let result: User | undefined;
    service.login('admin', 'secreto').subscribe((user) => (result = user));

    const login = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(login.request.body).toEqual({ username: 'admin', password: 'secreto' });
    login.flush({ token: 'jwt-123' });

    const validate = http.expectOne(`${environment.apiUrl}/auth/validate`);
    expect(validate.request.headers.get('Authorization')).toBe('Bearer jwt-123');
    validate.flush(ADMIN);

    expect(result).toEqual(ADMIN);
    expect(tokens.get()).toBe('jwt-123');
    expect(service.isAdmin()).toBeTrue();
    expect(service.canManageCatalog()).toBeTrue();
  });

  it('propaga el mensaje del backend cuando las credenciales son incorrectas', fakeAsync(() => {
    let message = '';
    service.login('admin', 'mala').subscribe({ error: (e: Error) => (message = e.message) });
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ message: 'Usuario o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });
    flush();

    expect(message).toBe('Usuario o contraseña incorrectos.');
    expect(service.isAuthenticated()).toBeFalse();
  }));

  it('descarta un token guardado que ya no es válido', fakeAsync(() => {
    tokens.set('vencido');
    let restored: User | null | undefined;
    service.restoreSession().subscribe((user) => (restored = user));
    http
      .expectOne(`${environment.apiUrl}/auth/validate`)
      .flush({ message: 'expirado' }, { status: 401, statusText: 'Unauthorized' });
    flush();

    expect(restored).toBeNull();
    expect(tokens.get()).toBeNull();
  }));

  it('solo permite modificar recursos propios salvo al administrador', () => {
    service.login('ana', 'x').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ token: 't' });
    http
      .expectOne(`${environment.apiUrl}/auth/validate`)
      .flush({ id: 2, username: 'ana', role: 'MODEL_ENGINEER', localAccount: true });

    expect(service.canModify('ana')).toBeTrue();
    expect(service.canModify('otro')).toBeFalse();
  });
});

describe('safeReturnUrl', () => {
  it('solo acepta rutas internas', () => {
    expect(safeReturnUrl('/metamodelos')).toBe('/metamodelos');
    expect(safeReturnUrl('//evil.com')).toBe('/inicio');
    expect(safeReturnUrl('https://evil.com')).toBe('/inicio');
    expect(safeReturnUrl(undefined)).toBe('/inicio');
  });
});

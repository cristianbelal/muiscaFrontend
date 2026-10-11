import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { NotificationService } from '../notifications/notification.service';
import { Role } from '../models';
import { authGuard, guestGuard, roleGuard } from './auth.guards';
import { AuthService } from './auth.service';

describe('auth guards', () => {
  const authenticated = signal(false);
  const role = signal<Role | null>(null);
  const authStub = {
    isAuthenticated: authenticated,
    hasAnyRole: (roles?: Role[]) => !roles || (role() !== null && roles.includes(role()!)),
  };

  const run = (guard: CanActivateFn, data: Record<string, unknown> = {}, url = '/metamodelos') =>
    TestBed.runInInjectionContext(() =>
      guard({ data } as unknown as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  beforeEach(() => {
    authenticated.set(false);
    role.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['error']) },
      ],
    });
  });

  it('authGuard lleva al login conservando la ruta pedida', () => {
    const result = run(authGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fmetamodelos');
  });

  it('authGuard deja pasar con sesión', () => {
    authenticated.set(true);
    expect(run(authGuard)).toBeTrue();
  });

  it('guestGuard redirige al inicio si ya hay sesión', () => {
    authenticated.set(true);
    expect(TestBed.inject(Router).serializeUrl(run(guestGuard) as UrlTree)).toBe('/inicio');
  });

  it('roleGuard bloquea a un USER en secciones de ingeniería', () => {
    authenticated.set(true);
    role.set('USER');
    const result = run(roleGuard, { roles: ['ADMIN', 'MODEL_ENGINEER'] }) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/inicio');
    expect(TestBed.inject(NotificationService).error).toHaveBeenCalled();
  });

  it('roleGuard permite a un MODEL_ENGINEER gestionar el catálogo', () => {
    authenticated.set(true);
    role.set('MODEL_ENGINEER');
    expect(run(roleGuard, { roles: ['ADMIN', 'MODEL_ENGINEER'] })).toBeTrue();
  });
});

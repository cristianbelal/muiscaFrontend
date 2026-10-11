import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NotificationService } from '../notifications/notification.service';
import { Role } from '../models';
import { AuthService, HOME_URL } from './auth.service';

/**
 * Las rutas privadas exigen sesión. La sesión ya se restauró antes de la primera navegación
 * (provideAppInitializer en app.config.ts), así que estos guards son síncronos.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Login y registro solo tienen sentido sin sesión. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree([HOME_URL]) : true;
};

/**
 * Restringe una ruta a los roles de route.data['roles'], replicando las reglas de
 * SecurityConfig. Es solo usabilidad: el backend sigue validando cada petición.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const roles = route.data['roles'] as Role[] | undefined;
  if (auth.hasAnyRole(roles)) {
    return true;
  }
  inject(NotificationService).error('Su rol no tiene permiso para acceder a esa sección.');
  return inject(Router).createUrlTree([HOME_URL]);
};

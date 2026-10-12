import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notifications/notification.service';
import { toApiError } from './api-error';
import { SILENT_ERRORS, SKIP_SESSION_EXPIRED } from './http-context';

/**
 * Manejo centralizado de errores HTTP:
 * 1. Normaliza cualquier HttpErrorResponse (JSON, texto o Blob) a ApiError.
 * 2. Ante un 401 en una ruta protegida, cierra la sesión y lleva al login.
 * 3. Muestra el mensaje del backend, salvo que la petición use SILENT_ERRORS.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      return from(toApiError(error)).pipe(
        switchMap((apiError) => {
          if (apiError.status === 401 && !req.context.get(SKIP_SESSION_EXPIRED)) {
            auth.handleSessionExpired();
          } else if (!req.context.get(SILENT_ERRORS)) {
            notifications.error(apiError.message);
          }
          return throwError(() => apiError);
        }),
      );
    }),
  );
};

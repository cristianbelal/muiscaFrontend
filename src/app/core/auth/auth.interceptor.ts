import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { isApiRequest } from '../http/api-url';
import { TokenStorage } from './token-storage.service';

/** Adjunta "Authorization: Bearer <jwt>" a las peticiones dirigidas al backend MUISCA. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorage).get();
  if (!token || !isApiRequest(req.url) || req.headers.has('Authorization')) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

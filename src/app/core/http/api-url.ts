import { environment } from '../../../environments/environment';

/** Construye una URL absoluta del backend a partir de una ruta como '/api/metamodels'. */
export function apiUrl(path: string): string {
  return `${environment.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/** true si la petición va dirigida al backend MUISCA (y no a Google u otro origen). */
export function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

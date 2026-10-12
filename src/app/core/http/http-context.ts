import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * La petición maneja sus errores en la propia pantalla (por ejemplo, para mostrar los
 * problemas de compilación junto al formulario), así que el interceptor no muestra el aviso.
 */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

/**
 * Un 401 en esta petición no significa "sesión vencida" (login con credenciales erróneas o
 * restauración de sesión al arrancar), así que no se redirige al login.
 */
export const SKIP_SESSION_EXPIRED = new HttpContextToken<boolean>(() => false);

export function silentErrors(context = new HttpContext()): HttpContext {
  return context.set(SILENT_ERRORS, true);
}

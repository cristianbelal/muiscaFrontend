import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';
/** Clave que usaba el prototipo anterior para cachear el usuario; ya no se usa. */
const LEGACY_USER_KEY = 'userData';

/**
 * Persistencia del JWT. Se aísla aquí para que el resto de la app no dependa de
 * localStorage (que puede lanzar excepciones en modo privado o con el almacenamiento bloqueado).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Sin almacenamiento la sesión solo dura mientras la pestaña esté abierta.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
    } catch {
      // Nada que limpiar.
    }
  }
}

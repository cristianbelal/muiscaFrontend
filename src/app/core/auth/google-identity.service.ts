import { Injectable, NgZone, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Subconjunto tipado de la API de Google Identity Services que usa MUISCA. */
interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (response: { credential?: string }) => void }): void;
  renderButton(element: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const SCRIPT_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 100;

/**
 * Integra el botón "Iniciar sesión con Google". El script se carga en index.html; aquí solo
 * se espera a que esté disponible (con límite de tiempo) y se renderiza el botón.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly zone = inject(NgZone);

  /**
   * @param onCredential recibe el ID token de Google (se ejecuta dentro de la zona de Angular)
   * @returns false si Google Identity Services no cargó a tiempo
   */
  async renderButton(container: HTMLElement, onCredential: (credential: string | null) => void): Promise<boolean> {
    const accounts = await this.waitForLibrary();
    if (!accounts) {
      return false;
    }
    accounts.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.zone.run(() => onCredential(response.credential ?? null)),
    });
    accounts.renderButton(container, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      locale: 'es',
      width: Math.min(container.clientWidth || 320, 400),
    });
    return true;
  }

  private waitForLibrary(): Promise<GoogleAccountsId | null> {
    return new Promise((resolve) => {
      const started = Date.now();
      const check = () => {
        const accounts = window.google?.accounts?.id;
        if (accounts) {
          resolve(accounts);
        } else if (Date.now() - started > SCRIPT_TIMEOUT_MS) {
          resolve(null);
        } else {
          setTimeout(check, POLL_INTERVAL_MS);
        }
      };
      check();
    });
  }
}

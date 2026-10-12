/**
 * Configuración inyectada al desplegar mediante /config.js (ver scripts/write-runtime-config.mjs).
 * En local el archivo de public/ está vacío y rigen los valores de environment*.ts.
 */
export interface RuntimeConfig {
  apiUrl?: string;
  googleClientId?: string;
  /** Nombre del entorno que se muestra en la barra superior (p. ej. "Laboratorio"). */
  environmentName?: string;
}

export const runtimeConfig: RuntimeConfig =
  (globalThis as { __MUISCA_CONFIG__?: RuntimeConfig }).__MUISCA_CONFIG__ ?? {};

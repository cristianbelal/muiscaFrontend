import { runtimeConfig } from './runtime-config';

/** Configuración de producción. En los despliegues la URL del backend llega por /config.js. */
export const environment = {
  production: true,
  apiUrl: (runtimeConfig.apiUrl || 'http://localhost:8080').replace(/\/+$/, ''),
  googleClientId:
    runtimeConfig.googleClientId || '928310748438-5smhnfqq6hui1vok3q9vf7333apuibis.apps.googleusercontent.com',
  environmentName: runtimeConfig.environmentName || '',
};

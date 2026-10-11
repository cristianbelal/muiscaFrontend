import { runtimeConfig } from './runtime-config';

/** Configuración de desarrollo (ng serve). El backend Spring Boot corre en el puerto 8080. */
export const environment = {
  production: false,
  apiUrl: (runtimeConfig.apiUrl || 'http://localhost:8080').replace(/\/+$/, ''),
  googleClientId:
    runtimeConfig.googleClientId || '928310748438-5smhnfqq6hui1vok3q9vf7333apuibis.apps.googleusercontent.com',
  environmentName: runtimeConfig.environmentName || 'Local',
};

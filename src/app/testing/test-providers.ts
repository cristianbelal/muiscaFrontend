import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '../core/http/error.interceptor';

/**
 * Providers mínimos para probar componentes de MUISCA sin backend real. Incluye el
 * interceptor de errores para que los fallos HTTP lleguen como ApiError, igual que en la app.
 */
export function provideTestEnvironment(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideHttpClientTesting(),
    provideRouter([]),
    provideNoopAnimations(),
  ];
}

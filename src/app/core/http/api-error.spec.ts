import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, asApiError, toApiError } from './api-error';

describe('toApiError', () => {
  it('usa el mensaje, los errores de campo y los problemas de GlobalExceptionHandler', async () => {
    const error = await toApiError(
      new HttpErrorResponse({
        status: 400,
        error: {
          status: 400,
          message: "El módulo ATL 'x.atl' no compila",
          errors: ['name: must not be blank'],
          problems: [{ severity: 'ERROR', line: 3, message: 'missing ;' }],
        },
      }),
    );
    expect(error).toEqual(jasmine.any(ApiError));
    expect(error.status).toBe(400);
    expect(error.message).toBe("El módulo ATL 'x.atl' no compila");
    expect(error.fieldErrors).toEqual(['name: must not be blank']);
    expect(error.problems.length).toBe(1);
  });

  it('lee el JSON de error de las descargas que piden un Blob', async () => {
    const blob = new Blob([JSON.stringify({ message: 'El archivo está vacío' })], { type: 'application/json' });
    const error = await toApiError(new HttpErrorResponse({ status: 400, error: blob }));
    expect(error.message).toBe('El archivo está vacío');
  });

  it('acepta respuestas de texto plano como la de /oauth/google', async () => {
    const error = await toApiError(new HttpErrorResponse({ status: 400, error: 'Token de Google inválido' }));
    expect(error.message).toBe('Token de Google inválido');
  });

  it('explica cuando el backend no responde', async () => {
    const error = await toApiError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));
    expect(error.isNetworkError).toBeTrue();
    expect(error.message).toContain('No se pudo conectar');
  });
});

describe('asApiError', () => {
  it('envuelve errores desconocidos', () => {
    const error = asApiError(new TypeError('boom'));
    expect(error).toEqual(jasmine.any(ApiError));
    expect(error.message).toBe('Ocurrió un error inesperado.');
  });
});

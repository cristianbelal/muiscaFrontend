import { HttpErrorResponse } from '@angular/common/http';
import { ArtifactProblem } from '../models';

/**
 * Error de la API normalizado a partir del cuerpo que arma GlobalExceptionHandler:
 * { timestamp, status, error, message, errors?, problems? }.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Errores de validación de campos (MethodArgumentNotValidException). */
    readonly fieldErrors: string[] = [],
    /** Problemas de compilación/validación de artefactos (InvalidArtifactException). */
    readonly problems: ArtifactProblem[] = [],
    /** Cuerpo original, para respuestas de error que traen datos útiles (p. ej. ejecución fallida). */
    readonly body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/** Garantiza un ApiError en los manejadores de error de los componentes. */
export function asApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(-1, 'Ocurrió un error inesperado.', [], [], error);
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'No se pudo conectar con el servidor MUISCA. Verifique su conexión o que el backend esté en ejecución.',
  401: 'Su sesión expiró o no es válida. Inicie sesión de nuevo.',
  403: 'Su rol no tiene permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación entra en conflicto con datos existentes.',
  413: 'El archivo supera el tamaño máximo permitido (10 MB).',
  422: 'No se pudo procesar el modelo.',
  500: 'Ocurrió un error interno en el servidor.',
};

/** Convierte cualquier HttpErrorResponse en ApiError, incluidas las respuestas Blob de descargas. */
export async function toApiError(response: HttpErrorResponse): Promise<ApiError> {
  const body = await readBody(response.error);
  const fallback = FALLBACK_MESSAGES[response.status] ?? `Error inesperado (${response.status}).`;

  if (isRecord(body)) {
    const message = typeof body['message'] === 'string' && body['message'] ? body['message'] : fallback;
    const fieldErrors = Array.isArray(body['errors']) ? body['errors'].map(String) : [];
    const problems = Array.isArray(body['problems']) ? (body['problems'] as ArtifactProblem[]) : [];
    return new ApiError(response.status, message, fieldErrors, problems, body);
  }
  if (typeof body === 'string' && body.trim() && !body.trim().startsWith('<')) {
    // Algunas rutas (p. ej. /oauth/google) responden texto plano.
    return new ApiError(response.status, body.trim(), [], [], body);
  }
  return new ApiError(response.status, fallback, [], [], body);
}

async function readBody(error: unknown): Promise<unknown> {
  if (error instanceof Blob) {
    const text = await error.text();
    return parseJson(text);
  }
  if (typeof error === 'string') {
    return parseJson(error);
  }
  return error;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

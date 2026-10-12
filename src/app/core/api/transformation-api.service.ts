import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { ApiError } from '../http/api-error';
import { apiUrl } from '../http/api-url';
import { toFormData } from '../http/form-data';
import { silentErrors } from '../http/http-context';
import { Execution, Transformation, TransformationRequest } from '../models';

/**
 * TransformationController: /api/transformations. Cualquier usuario lista y ejecuta las
 * publicadas; MODEL_ENGINEER/ADMIN las definen y solo ADMIN las publica.
 */
@Injectable({ providedIn: 'root' })
export class TransformationApi {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/transformations');

  /** @param published filtro opcional; el backend ignora el filtro para el rol USER (solo publicadas) */
  list(published?: boolean): Observable<Transformation[]> {
    let params = new HttpParams();
    if (published !== undefined) {
      params = params.set('published', published);
    }
    return this.http.get<Transformation[]>(this.base, { params });
  }

  get(id: number): Observable<Transformation> {
    return this.http.get<Transformation>(`${this.base}/${id}`);
  }

  create(request: TransformationRequest): Observable<Transformation> {
    return this.http.post<Transformation>(this.base, request, { context: silentErrors() });
  }

  update(id: number, request: TransformationRequest): Observable<Transformation> {
    return this.http.put<Transformation>(`${this.base}/${id}`, request, { context: silentErrors() });
  }

  setPublication(id: number, published: boolean): Observable<Transformation> {
    return this.http.patch<Transformation>(`${this.base}/${id}/publication`, { published });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Ejecuta la transformación sobre el modelo del usuario. El backend responde 201 si terminó
   * bien y 422 si el motor falló; en ambos casos devuelve la ejecución registrada, así que el
   * 422 se convierte en un resultado normal con status FAILED.
   */
  execute(id: number, inputModel: File): Observable<Execution> {
    return this.run(id, toFormData({ inputModel }));
  }

  /** Igual que execute, pero con un modelo de la biblioteca del usuario (parámetro modelId). */
  executeStoredModel(id: number, modelId: number): Observable<Execution> {
    return this.run(id, toFormData({ modelId }));
  }

  /**
   * Inicia la ejecución en segundo plano (async=true): el backend valida el modelo, responde 202
   * con la ejecución RUNNING y se sigue con ExecutionApi.watch(). Recibe un archivo o un modelo guardado.
   */
  start(id: number, model: { inputModel: File } | { modelId: number }): Observable<Execution> {
    return this.run(id, toFormData({ ...model, async: true }));
  }

  private run(id: number, body: FormData): Observable<Execution> {
    return this.http
      .post<Execution>(`${this.base}/${id}/executions`, body, { context: silentErrors() })
      .pipe(
        catchError((error: unknown) =>
          error instanceof ApiError && error.status === 422 && isExecution(error.body)
            ? of(error.body)
            : throwError(() => error),
        ),
      );
  }
}

function isExecution(body: unknown): body is Execution {
  return typeof body === 'object' && body !== null && 'status' in body && 'transformationName' in body;
}

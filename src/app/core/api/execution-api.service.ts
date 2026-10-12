import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, takeWhile, timer } from 'rxjs';
import { FileDownloadService } from '../files/file-download.service';
import { apiUrl } from '../http/api-url';
import { Execution, ExecutionArtifact, ExecutionSearch, ExecutionSummary, GeneratedFile, Page } from '../models';

/** ExecutionController: /api/executions. Cada usuario ve las suyas; el administrador, todas. */
@Injectable({ providedIn: 'root' })
export class ExecutionApi {
  private readonly http = inject(HttpClient);
  private readonly files = inject(FileDownloadService);
  private readonly base = apiUrl('/api/executions');

  list(): Observable<ExecutionSummary[]> {
    return this.http.get<ExecutionSummary[]>(this.base);
  }

  /** Historial paginado y filtrado en el servidor (GET /api/executions/search). */
  search(criteria: ExecutionSearch): Observable<Page<ExecutionSummary>> {
    let params = new HttpParams().set('page', criteria.page).set('size', criteria.size);
    if (criteria.status) {
      params = params.set('status', criteria.status);
    }
    if (criteria.q?.trim()) {
      params = params.set('q', criteria.q.trim());
    }
    return this.http.get<Page<ExecutionSummary>>(`${this.base}/search`, { params });
  }

  get(id: number): Observable<Execution> {
    return this.http.get<Execution>(`${this.base}/${id}`);
  }

  /**
   * Consulta la ejecución cada intervalMs y emite cada estado (para mostrar la etapa) hasta
   * que deja de estar RUNNING; el último valor emitido es el resultado final.
   */
  watch(id: number, intervalMs = 1500): Observable<Execution> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.get(id)),
      takeWhile((execution) => execution.status === 'RUNNING', true),
    );
  }

  /** Código generado sin descomprimir el ZIP, para previsualizarlo en pantalla. */
  generatedFiles(id: number): Observable<GeneratedFile[]> {
    return this.http.get<GeneratedFile[]>(`${this.base}/${id}/generated-files`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Descarga un artefacto usando el enlace relativo que el backend publica en downloads. */
  download(execution: Execution, artifact: Exclude<ExecutionArtifact, 'generatedFiles'>): Observable<void> {
    const path = execution.downloads[artifact] ?? `/api/executions/${execution.id}/${ARTIFACT_PATHS[artifact]}`;
    return this.files.download(path, fallbackName(execution, artifact));
  }
}

const ARTIFACT_PATHS: Record<Exclude<ExecutionArtifact, 'generatedFiles'>, string> = {
  inputModel: 'input-model',
  outputModel: 'output-model',
  generatedCode: 'generated-code',
};

function fallbackName(execution: Execution, artifact: Exclude<ExecutionArtifact, 'generatedFiles'>): string {
  switch (artifact) {
    case 'inputModel':
      return execution.inputModelName;
    case 'outputModel':
      return execution.outputModelName ?? `ejecucion-${execution.id}-salida.xmi`;
    case 'generatedCode':
      return `ejecucion-${execution.id}-codigo.zip`;
  }
}


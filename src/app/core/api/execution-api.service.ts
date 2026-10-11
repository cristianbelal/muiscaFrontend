import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FileDownloadService } from '../files/file-download.service';
import { apiUrl } from '../http/api-url';
import { Execution, ExecutionArtifact, ExecutionSummary, GeneratedFile } from '../models';

/** ExecutionController: /api/executions. Cada usuario ve las suyas; el administrador, todas. */
@Injectable({ providedIn: 'root' })
export class ExecutionApi {
  private readonly http = inject(HttpClient);
  private readonly files = inject(FileDownloadService);
  private readonly base = apiUrl('/api/executions');

  list(): Observable<ExecutionSummary[]> {
    return this.http.get<ExecutionSummary[]>(this.base);
  }

  get(id: number): Observable<Execution> {
    return this.http.get<Execution>(`${this.base}/${id}`);
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

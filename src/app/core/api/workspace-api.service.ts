import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../http/api-url';
import { toFormData } from '../http/form-data';
import { silentErrors } from '../http/http-context';
import { AtlCompilation, TemplateCompilation } from '../models';

export interface RunAtlCommand {
  sourceMetamodel: File;
  targetMetamodel: File;
  atlFile: File;
  inputModel: File;
}

export interface RunTemplateCommand {
  metamodel: File;
  templateFile: File;
  inputModel: File;
}

/**
 * WorkspaceController: /api/workspace (MODEL_ENGINEER y ADMIN). Compila y prueba módulos
 * ATL y plantillas Acceleo sin registrarlos en el catálogo, como una configuración de
 * ejecución de Eclipse. Todos los errores se muestran junto al formulario.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceApi {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/workspace');

  compileAtl(atlFile: File): Observable<AtlCompilation> {
    return this.http.post<AtlCompilation>(`${this.base}/atl/compile`, toFormData({ atlFile }), {
      context: silentErrors(),
    });
  }

  /** Devuelve el modelo de salida (.xmi). */
  runAtl(command: RunAtlCommand): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.base}/atl/run`, toFormData({ ...command }), {
      observe: 'response',
      responseType: 'blob',
      context: silentErrors(),
    });
  }

  compileTemplate(metamodel: File, templateFile: File): Observable<TemplateCompilation> {
    return this.http.post<TemplateCompilation>(
      `${this.base}/acceleo/compile`,
      toFormData({ metamodel, templateFile }),
      { context: silentErrors() },
    );
  }

  /** Devuelve un ZIP con el código generado. */
  runTemplate(command: RunTemplateCommand): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.base}/acceleo/run`, toFormData({ ...command }), {
      observe: 'response',
      responseType: 'blob',
      context: silentErrors(),
    });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FileDownloadService } from '../files/file-download.service';
import { apiUrl } from '../http/api-url';
import { toFormData } from '../http/form-data';
import { silentErrors } from '../http/http-context';
import { MetadataRequest, StoredModel } from '../models';

export interface CreateStoredModelCommand {
  modelFile: File;
  name: string | null;
  description: string | null;
}

/** StoredModelController: /api/models (biblioteca de modelos de cada usuario). */
@Injectable({ providedIn: 'root' })
export class StoredModelApi {
  private readonly http = inject(HttpClient);
  private readonly files = inject(FileDownloadService);
  private readonly base = apiUrl('/api/models');

  list(): Observable<StoredModel[]> {
    return this.http.get<StoredModel[]>(this.base);
  }

  /** El backend detecta el metamodelo por el nsURI del modelo y lo valida antes de guardarlo. */
  create(command: CreateStoredModelCommand): Observable<StoredModel> {
    return this.http.post<StoredModel>(this.base, toFormData({ ...command }), { context: silentErrors() });
  }

  /** Guarda en la biblioteca el modelo transformado de una ejecución. */
  createFromExecution(executionId: number, name?: string): Observable<StoredModel> {
    const params = name ? new HttpParams().set('name', name) : undefined;
    return this.http.post<StoredModel>(`${this.base}/from-execution/${executionId}`, null, { params });
  }

  updateMetadata(id: number, request: MetadataRequest): Observable<StoredModel> {
    return this.http.patch<StoredModel>(`${this.base}/${id}`, request, { context: silentErrors() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  download(model: StoredModel): Observable<void> {
    return this.files.download(`/api/models/${model.id}/content`, model.fileName);
  }
}

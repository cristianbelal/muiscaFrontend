import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FileDownloadService } from '../files/file-download.service';
import { apiUrl } from '../http/api-url';
import { toFormData } from '../http/form-data';
import { silentErrors } from '../http/http-context';
import { Metamodel } from '../models';

export interface CreateMetamodelCommand {
  name: string;
  description: string | null;
  ecoreFile: File;
  genmodelFile: File | null;
}

/** MetamodelController: /api/metamodels (MODEL_ENGINEER y ADMIN). */
@Injectable({ providedIn: 'root' })
export class MetamodelApi {
  private readonly http = inject(HttpClient);
  private readonly files = inject(FileDownloadService);
  private readonly base = apiUrl('/api/metamodels');

  list(): Observable<Metamodel[]> {
    return this.http.get<Metamodel[]>(this.base);
  }

  get(id: number): Observable<Metamodel> {
    return this.http.get<Metamodel>(`${this.base}/${id}`);
  }

  /** Los errores se muestran en el formulario (incluidos los problemas del .ecore). */
  create(command: CreateMetamodelCommand): Observable<Metamodel> {
    return this.http.post<Metamodel>(this.base, toFormData({ ...command }), { context: silentErrors() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  downloadEcore(metamodel: Metamodel): Observable<void> {
    return this.files.download(`/api/metamodels/${metamodel.id}/ecore`, metamodel.ecoreFileName);
  }

  /** El .ecore como File, para enviarlo al espacio de trabajo (que recibe archivos, no ids). */
  fetchEcore(id: number): Observable<File> {
    return this.files.fetchFile(`/api/metamodels/${id}/ecore`, `metamodelo-${id}.ecore`);
  }
}

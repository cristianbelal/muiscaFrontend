import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FileDownloadService } from '../files/file-download.service';
import { apiUrl } from '../http/api-url';
import { toFormData } from '../http/form-data';
import { silentErrors } from '../http/http-context';
import { AtlModule, MetadataRequest } from '../models';

export interface CreateAtlModuleCommand {
  name: string;
  description: string | null;
  sourceMetamodelId: number;
  targetMetamodelId: number;
  atlFile: File;
}

/** AtlModuleController: /api/atl-modules (MODEL_ENGINEER y ADMIN). */
@Injectable({ providedIn: 'root' })
export class AtlModuleApi {
  private readonly http = inject(HttpClient);
  private readonly files = inject(FileDownloadService);
  private readonly base = apiUrl('/api/atl-modules');

  list(): Observable<AtlModule[]> {
    return this.http.get<AtlModule[]>(this.base);
  }

  get(id: number): Observable<AtlModule> {
    return this.http.get<AtlModule>(`${this.base}/${id}`);
  }

  create(command: CreateAtlModuleCommand): Observable<AtlModule> {
    return this.http.post<AtlModule>(this.base, toFormData({ ...command }), { context: silentErrors() });
  }

  /** Reemplaza el código fuente; el backend lo recompila antes de guardarlo. */
  updateSource(id: number, atlFile: File): Observable<AtlModule> {
    return this.http.put<AtlModule>(`${this.base}/${id}/source`, toFormData({ atlFile }), {
      context: silentErrors(),
    });
  }

  /** Cambia nombre y descripción sin modificar el archivo (PATCH /{id}). */
  updateMetadata(id: number, request: MetadataRequest): Observable<AtlModule> {
    return this.http.patch<AtlModule>(`${this.base}/${id}`, request, { context: silentErrors() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  downloadSource(module: AtlModule): Observable<void> {
    return this.files.download(`/api/atl-modules/${module.id}/source`, `${module.moduleName}.atl`);
  }
}

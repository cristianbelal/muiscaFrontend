import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FileDownloadService } from '../files/file-download.service';
import { apiUrl } from '../http/api-url';
import { toFormData } from '../http/form-data';
import { silentErrors } from '../http/http-context';
import { AcceleoModule } from '../models';

export interface CreateAcceleoModuleCommand {
  name: string;
  description: string | null;
  metamodelId: number;
  templateFile: File;
}

/** AcceleoModuleController: /api/acceleo-modules (MODEL_ENGINEER y ADMIN). */
@Injectable({ providedIn: 'root' })
export class AcceleoModuleApi {
  private readonly http = inject(HttpClient);
  private readonly files = inject(FileDownloadService);
  private readonly base = apiUrl('/api/acceleo-modules');

  list(): Observable<AcceleoModule[]> {
    return this.http.get<AcceleoModule[]>(this.base);
  }

  get(id: number): Observable<AcceleoModule> {
    return this.http.get<AcceleoModule>(`${this.base}/${id}`);
  }

  create(command: CreateAcceleoModuleCommand): Observable<AcceleoModule> {
    return this.http.post<AcceleoModule>(this.base, toFormData({ ...command }), { context: silentErrors() });
  }

  updateSource(id: number, templateFile: File): Observable<AcceleoModule> {
    return this.http.put<AcceleoModule>(`${this.base}/${id}/source`, toFormData({ templateFile }), {
      context: silentErrors(),
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  downloadSource(module: AcceleoModule): Observable<void> {
    return this.files.download(`/api/acceleo-modules/${module.id}/source`, `${module.moduleName}.mtl`);
  }
}

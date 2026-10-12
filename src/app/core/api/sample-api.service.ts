import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FileDownloadService } from '../files/file-download.service';
import { apiUrl } from '../http/api-url';
import { SampleModel } from '../models';

/** SampleModelController: /api/samples (modelos de ejemplo incluidos en MUISCA). */
@Injectable({ providedIn: 'root' })
export class SampleApi {
  private readonly http = inject(HttpClient);
  private readonly files = inject(FileDownloadService);

  list(): Observable<SampleModel[]> {
    return this.http.get<SampleModel[]>(apiUrl('/api/samples'));
  }

  /** El ejemplo como File, listo para usarlo como modelo de entrada. */
  fetch(sample: SampleModel): Observable<File> {
    return this.files.fetchFile(`/api/samples/${encodeURIComponent(sample.fileName)}`, sample.fileName);
  }
}

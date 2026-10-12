import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../http/api-url';

/**
 * Descarga archivos protegidos por JWT. Un enlace <a href> no envía la cabecera
 * Authorization, por eso se pide el Blob con HttpClient y se guarda desde el navegador.
 */
@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly http = inject(HttpClient);

  /** @param path ruta relativa de la API, p. ej. '/api/metamodels/1/ecore' */
  download(path: string, fallbackName: string): Observable<void> {
    return this.http
      .get(apiUrl(path), { observe: 'response', responseType: 'blob' })
      .pipe(map((response) => this.saveResponse(response, fallbackName)));
  }

  /** Obtiene el archivo como File (p. ej. para reenviarlo a otro endpoint). */
  fetchFile(path: string, fallbackName: string): Observable<File> {
    return this.http
      .get(apiUrl(path), { observe: 'response', responseType: 'blob' })
      .pipe(
        map((response) => {
          const name = filenameFrom(response.headers.get('Content-Disposition')) ?? fallbackName;
          return new File([response.body ?? new Blob()], name, { type: response.body?.type });
        }),
      );
  }

  saveResponse(response: HttpResponse<Blob>, fallbackName: string): void {
    const name = filenameFrom(response.headers.get('Content-Disposition')) ?? fallbackName;
    this.saveBlob(response.body ?? new Blob(), name);
  }

  saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Extrae el nombre de archivo de Content-Disposition (soporta filename*=UTF-8''...). */
export function filenameFrom(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(contentDisposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // Se intenta con el parámetro filename simple.
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/.exec(contentDisposition);
  return plain ? plain[1].trim() : null;
}

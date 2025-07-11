import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilesService {
  // URL del endpoint para obtener el archivo

  private apiUrlGetFiles = `http://localhost:8080/api/atl/files`;
  private apiUrlDeleteFiles = `http://localhost:8080/api/atl/files/`;
  private apiUrlPostFiles = `http://localhost:8080/api/atl/files/upload`;

  constructor(private http: HttpClient) {}

  getFiles(token: string | null): Observable<any> {
    return this.http
      .get(this.apiUrlGetFiles, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'json',
      })
      .pipe(
        tap((respuesta) => {
          console.log('Respuesta del backend en FilesService:', respuesta);
        })
      );
  }
  deleteFile(token: string | null, fileId: string): Observable<any> {
    console.log('url: ', `${this.apiUrlDeleteFiles}${fileId}`);
    return this.http
      .delete(`${this.apiUrlDeleteFiles}${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'json',
      })
      .pipe(
        tap((respuesta) => {
          console.log('Respuesta del backend en FilesService:', respuesta);
        })
      );
  }
  saveFile(token: string | null, archivo: any): Observable<any> {
    return this.http
      .post(this.apiUrlPostFiles, archivo, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'json',
      })
      .pipe(
        tap((respuesta) => {
          console.log('Respuesta del backend en FilesService:', respuesta);
        })
      );
  }
}

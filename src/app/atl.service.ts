/*import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders,  } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AtlService {
  private apiUrl = 'http://localhost:8080/api/atl/transform'; // URL del endpoint del backend

  constructor(private http: HttpClient) {}
*/
  /**
   * Envía los archivos y el tipo de transformación al backend.
   * @param inModel Archivo del modelo de entrada (.xmi).
   * @param inMetamodel Archivo del metamodelo de entrada (.ecore).
   * @param outMetamodel Archivo del metamodelo de salida (.ecore).
   * @param transformationType Tipo de transformación.
   * @returns Observable con la respuesta del backend.
   */
/*
  transform(
    inModel: string,
    inMetamodel: string,
    outMetamodel: string,
    transformationType: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('inModel', inModel);
    formData.append('inMetamodel', inMetamodel);
    formData.append('outMetamodel', outMetamodel);
    formData.append('transformationType', transformationType);

    return this.http.post(this.apiUrl, formData, {
      headers: new HttpHeaders(),
      responseType: 'text', // Cambia según el tipo de respuesta del backend
    });
  }
}*/

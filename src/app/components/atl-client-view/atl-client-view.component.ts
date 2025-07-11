import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AtlService } from '../../atl.service';
import { FilesService } from '../../services/files/files.service';

@Component({
  selector: 'app-atl-client-view',
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './atl-client-view.component.html',
  styleUrl: './atl-client-view.component.css',
})
export class AtlClientViewComponent {
  archivoSeleccionado: File | null = null;
  inModelFile: File | null = null;
  inMetamodelFile: File | null = null;
  outMetamodelFile: File | null = null;
  transformationType: string = '';
  responseMessage: string = '';
  viewFiles = false;
  mostrarTransfomacion = false;
  username: string = '';
  transformationTypes: {
    id: number;
    filename: string;
    fileType: string;
    createdAt: string;
  }[] = [];

  constructor(
    private atlService: AtlService,
    private router: Router,
    private fileService: FilesService
  ) {}

  archivosGenerados: { nombre: String; id: String }[] = [];

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    this.username = userData.username || userData.nombreUsuario || '';
    if (!token) {
      this.router.navigate(['/login']);
    }

    // Llama al servicio para obtener los archivos y extraer los tipos únicos
    this.fileService.getFiles(token).subscribe({
      next: (archivos) => {
        if (Array.isArray(archivos)) {
          this.transformationTypes = archivos;
          console.log(
            'Archivos obtenidos:',
            this.transformationTypes.map((t) => t.filename)
          );
        } else {
          this.transformationTypes = [];
          console.error('La respuesta de archivos no es un array:', archivos);
        }
      },
      error: () => {
        this.transformationTypes = [];
      },
    });
  }

  onFileChange(event: any, fileType: string): void {
    const file = event.target.files[0];
    if (fileType === 'inModel') this.inModelFile = file;
    if (fileType === 'inMetamodel') this.inMetamodelFile = file;
    if (fileType === 'outMetamodel') this.outMetamodelFile = file;
  }

  onSubmit(): void {
    // Verifica si todos los campos están completos
    // y si los archivos son válidos
    console.log('inModelFile:', this.inModelFile);
    console.log('inMetamodelFile:', this.inMetamodelFile);
    console.log('outMetamodelFile:', this.outMetamodelFile);
    console.log('transformationType:', this.transformationType);
    if (
      this.inModelFile &&
      this.inMetamodelFile &&
      this.outMetamodelFile &&
      this.transformationType
    ) {
      this.atlService
        .transform(
          this.inModelFile,
          this.inMetamodelFile,
          this.outMetamodelFile,
          this.transformationType
        )
        .subscribe({
          next: (response) => {
            this.responseMessage = response;
          },
          error: (error) => {
            this.responseMessage = `Error: ${error.message}`;
          },
        });
    } else {
      this.responseMessage = 'Por favor, completa todos los campos.';
    }
  }
  logout(): void {
    localStorage.removeItem('token'); // Elimina el token del almacenamiento local
    this.router.navigate(['/login']); // Redirige a la página de inicio de sesión
  }
  verTransformaciones() {
    this.fileService.getFiles(localStorage.getItem('token')).subscribe({
      next: (archivos) => {
        if (archivos || archivos.length != 0) {
          console.log('Archivos obtenidos:', archivos);
          this.archivosGenerados = archivos.map((archivo: any) => ({
            nombre: archivo.filename || archivo.fileName,
            id: archivo.id || archivo.fileId,
          }));
          this.viewFiles = true;
          //this.responseMessage = 'Archivos obtenidos correctamente.';
        } else {
          console.log('No se encontraron archivos.');
          this.responseMessage = 'No se encontraron archivos.';
          return;
        }
      },
      error: (error) => {
        console.error('Error al obtener los archivos:', error);
      },
    });
  }
  verTransformacion() {
    this.mostrarTransfomacion = true;
  }
  guardarArchivo(archivo: any): void {
    const token = localStorage.getItem('token');
    this.fileService.saveFile(token, archivo).subscribe({
      next: (response) => {
        console.log('Archivo guardado:', response);
        this.responseMessage = 'Archivo guardado correctamente.';
      },
    });
  }
  eliminarArchivo(archivo: any): void {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar el archivo "${archivo.nombre}"?`
    );
    if (!confirmado) {
      return;
    }
    const token = localStorage.getItem('token');
    console.log('Eliminando archivo:', archivo);
    this.fileService.deleteFile(token, archivo.id).subscribe({
      next: () => {
        console.log('Archivo eliminado:', archivo);
        this.responseMessage = 'Archivo eliminado correctamente.';
        setTimeout(() => this.verTransformaciones(), 300);
      },
      error: (error) => {
        console.error('Error al eliminar el archivo:', error);
        this.responseMessage = `Error al eliminar el archivo: ${error.message}`;
      },
    });
  }
  eliminarCuenta() {}
  editarCuenta() {
    this.fileService;
  }
  mostrarMenuSubirArchivo = false;

  onTransformationTypeChange(inputArchivo: HTMLInputElement) {
    if (this.transformationType === 'subir') {
      inputArchivo.value = ''; // Resetea el input para permitir abrir siempre
      inputArchivo.click();
    }
  }
  abrirDialogoSubirArchivo() {
    this.mostrarMenuSubirArchivo = true;
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoSeleccionado = input.files[0];
    }
  }

  subirArchivoAlBackend() {
    if (this.archivoSeleccionado) {
      //this.fileService.uploadFile(this.archivoSeleccionado).subscribe(...);
    }
  }
  agregarArchivoAlBackend(tipoSeleccionado: any) {
    console.log('Agregar al backend:', tipoSeleccionado);
  }
  /*agregarArchivoAlBackend(transformationType): string, file: File) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible para agregar el archivo.');
      return;
    }

    this.fileService.uploadFile(token, transformationType, file).subscribe({
      next: (response) => {
        console.log('Archivo subido correctamente:', response);
        this.responseMessage = 'Archivo subido correctamente.';

      },
      error: (error) => {
        console.error('Error al subir el archivo:', error);
        this.responseMessage = `Error al subir el archivo: ${error.message}`;
      },
    });
  }*/
  /*eliminarArchivoDeBackend(archivoId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible para eliminar el archivo.');
      return;
    }

    this.fileService.deleteFile(token, archivoId).subscribe({
      next: (response) => {
        console.log('Archivo eliminado correctamente:', response);
        this.responseMessage = 'Archivo eliminado correctamente.';

      },
      error: (error) => {
        console.error('Error al eliminar el archivo:', error);
        this.responseMessage = `Error al eliminar el archivo: ${error.message}`;
      },
    });
  }*/
}

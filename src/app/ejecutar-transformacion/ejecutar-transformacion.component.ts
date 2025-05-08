import { Component } from '@angular/core';

@Component({
  selector: 'app-ejecutar-transformacion',
  imports: [],
  templateUrl: './ejecutar-transformacion.component.html',
  styleUrl: './ejecutar-transformacion.component.css'
})
export class EjecutarTransformacionComponent {
  selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('Archivo seleccionado:', this.selectedFile);
    }
  }
  onSubmit(): void {
    if (this.selectedFile) {
      // Aquí puedes manejar el archivo seleccionado, por ejemplo, enviarlo a un servidor
      console.log('Archivo enviado:', this.selectedFile);
    } else {
      console.error('No se ha seleccionado ningún archivo.');
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { AtlService } from '../../atl.service'; // Asegúrate de que la ruta sea correcta
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-atl',
  standalone: true,
  templateUrl: './atl.component.html',
  styleUrls: ['./atl.component.css'],
  imports: [FormsModule, RouterModule, CommonModule],
})
export class AtlComponent  implements OnInit{
  inModelFile: File | null = null;
  inMetamodelFile: File | null = null;
  outMetamodelFile: File | null = null;
  transformationType: string = '';
  responseMessage: string = '';

  constructor(private atlService: AtlService, private router:Router) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
    }
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
}


/*import { Component } from '@angular/core';
import { AtlService } from '../atl.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-prueba',
  imports: [CommonModule, RouterModule,  HttpClientModule],
  templateUrl: './prueba.component.html',
  styleUrl: './prueba.component.css'
})
export class PruebaComponent {
  constructor(private router: Router, private atlService: AtlService) {}
}




constructor(private atlService: AtlService) {}

onFileChange(event: any, fileType: string): void {
    const file = event.target.files[0];
    if (fileType === 'inModel') this.inModelFile = file;
    if (fileType === 'inMetamodel') this.inMetamodelFile = file;
    if (fileType === 'outMetamodel') this.outMetamodelFile = file;
  }
  onSubmit(): void {
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
  }*/

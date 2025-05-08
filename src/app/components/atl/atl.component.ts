/*import { Component } from '@angular/core';
import { AtlService } from '../../atl.service'; // Asegúrate de que la ruta sea correcta
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-atl',
  standalone: true,
  templateUrl: './atl.component.html',
  styleUrls: ['./atl.component.css'],
  imports: [FormsModule, HttpClientModule],
})
export class AtlComponent {
  inModelFile: File | null = null;
  inMetamodelFile: File | null = null;
  outMetamodelFile: File | null = null;
  transformationType: string = '';
  responseMessage: string = '';

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
  }
}
*/

import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, finalize } from 'rxjs';
import { ApiError, asApiError } from '../../core/http/api-error';
import { ApiErrorPanelComponent } from '../components/api-error-panel/api-error-panel.component';
import { FilePickerComponent } from '../components/file-picker/file-picker.component';
import { acceptOf, fileValidators } from '../forms/file-validators';

export interface SourceUpdateDialogData<T> {
  title: string;
  description: string;
  label: string;
  extensions: readonly string[];
  /** Petición que sube el nuevo código (PUT .../{id}/source). */
  upload: (file: File) => Observable<T>;
}

/**
 * Reemplaza el código fuente de un módulo ATL o de una plantilla Acceleo. El backend lo
 * recompila; si no compila, los problemas se muestran aquí sin cerrar el diálogo.
 */
@Component({
  selector: 'app-source-update-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatProgressBarModule, FilePickerComponent, ApiErrorPanelComponent],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <p class="muted">{{ data.description }}</p>
        <app-file-picker [formControl]="file" [label]="data.label" [accept]="accept" />
        <app-api-error-panel [error]="error()" />
      </mat-dialog-content>
      @if (saving()) {
        <mat-progress-bar mode="indeterminate" aria-label="Compilando y guardando" />
      }
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="saving()">Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Compilar y guardar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class SourceUpdateDialogComponent<T> {
  readonly data = inject<SourceUpdateDialogData<T>>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<SourceUpdateDialogComponent<T>, T>>(MatDialogRef);

  readonly accept = acceptOf(this.data.extensions);
  readonly file = new FormControl<File | null>(null, [Validators.required, ...fileValidators(this.data.extensions)]);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  save(): void {
    const file = this.file.value;
    if (!file || this.file.invalid) {
      this.file.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.data
      .upload(file)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }
}

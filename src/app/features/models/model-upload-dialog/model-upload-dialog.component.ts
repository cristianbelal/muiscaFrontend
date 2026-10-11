import { Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import { StoredModelApi } from '../../../core/api/stored-model-api.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { StoredModel } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, optionalText } from '../../../shared/forms/form-utils';

/** Agrega un modelo a la biblioteca (POST /api/models). El metamodelo se detecta solo. */
@Component({
  selector: 'app-model-upload-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    FilePickerComponent,
    ApiErrorPanelComponent,
  ],
  template: `
    <h2 mat-dialog-title>Agregar modelo</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <p class="muted">
          MUISCA reconoce automáticamente a qué metamodelo pertenece y verifica que sea válido antes de guardarlo.
        </p>
        <app-file-picker formControlName="modelFile" label="Modelo (.xmi)" [accept]="accept" />
        <mat-form-field class="full-width">
          <mat-label>Nombre (opcional)</mat-label>
          <input matInput formControlName="name" [maxlength]="nameMax" />
          <mat-hint>Si lo deja vacío se usa el nombre del archivo.</mat-hint>
        </mat-form-field>
        <mat-form-field class="full-width">
          <mat-label>Descripción (opcional)</mat-label>
          <textarea matInput formControlName="description" rows="2" [maxlength]="descriptionMax"></textarea>
        </mat-form-field>
        <app-api-error-panel [error]="error()" />
      </mat-dialog-content>
      @if (saving()) {
        <mat-progress-bar mode="indeterminate" aria-label="Validando y guardando el modelo" />
      }
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="saving()">Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ModelUploadDialogComponent {
  private readonly api = inject(StoredModelApi);
  private readonly dialogRef = inject<MatDialogRef<ModelUploadDialogComponent, StoredModel>>(MatDialogRef);

  readonly accept = acceptOf(FILE_TYPES.model);
  readonly nameMax = NAME_MAX_LENGTH;
  readonly descriptionMax = DESCRIPTION_MAX_LENGTH;
  readonly form = inject(NonNullableFormBuilder).group({
    modelFile: new FormControl<File | null>(null, [Validators.required, ...fileValidators(FILE_TYPES.model)]),
    name: ['', [Validators.maxLength(NAME_MAX_LENGTH)]],
    description: ['', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
  });
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .create({ modelFile: value.modelFile!, name: optionalText(value.name), description: optionalText(value.description) })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (model) => this.dialogRef.close(model),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }
}

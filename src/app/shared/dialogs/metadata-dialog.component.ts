import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, finalize } from 'rxjs';
import { ApiError, asApiError } from '../../core/http/api-error';
import { MetadataRequest } from '../../core/models';
import { ApiErrorPanelComponent } from '../components/api-error-panel/api-error-panel.component';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, optionalText } from '../forms/form-utils';

export interface MetadataDialogData<T> {
  title: string;
  name: string;
  description: string | null;
  /** Petición PATCH que guarda los cambios. */
  save: (request: MetadataRequest) => Observable<T>;
}

/** Cambia nombre y descripción de un recurso sin tocar su archivo. */
@Component({
  selector: 'app-metadata-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    ApiErrorPanelComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <mat-form-field class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" [maxlength]="nameMax" required />
          @if (form.controls.name.hasError('required')) {
            <mat-error>El nombre es obligatorio.</mat-error>
          }
        </mat-form-field>
        <mat-form-field class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3" [maxlength]="descriptionMax"></textarea>
          <mat-hint align="end">{{ form.controls.description.value.length }} / {{ descriptionMax }}</mat-hint>
        </mat-form-field>
        <app-api-error-panel [error]="error()" />
      </mat-dialog-content>
      @if (saving()) {
        <mat-progress-bar mode="indeterminate" aria-label="Guardando" />
      }
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="saving()">Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="saving()">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class MetadataDialogComponent<T> {
  readonly data = inject<MetadataDialogData<T>>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<MetadataDialogComponent<T>, T>>(MatDialogRef);

  readonly nameMax = NAME_MAX_LENGTH;
  readonly descriptionMax = DESCRIPTION_MAX_LENGTH;
  readonly form = inject(NonNullableFormBuilder).group({
    name: [this.data.name, [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    description: [this.data.description ?? '', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
  });
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.data
      .save({ name: name.trim(), description: optionalText(description) })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }
}

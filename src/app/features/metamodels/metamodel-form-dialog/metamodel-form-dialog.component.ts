import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import { MetamodelApi } from '../../../core/api/metamodel-api.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { Metamodel } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, baseName, optionalText } from '../../../shared/forms/form-utils';

/** Registro de un metamodelo Ecore (POST /api/metamodels). El backend extrae el nsURI. */
@Component({
  selector: 'app-metamodel-form-dialog',
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
  templateUrl: './metamodel-form-dialog.component.html',
})
export class MetamodelFormDialogComponent {
  private readonly api = inject(MetamodelApi);
  private readonly dialogRef = inject<MatDialogRef<MetamodelFormDialogComponent, Metamodel>>(MatDialogRef);

  readonly nameMax = NAME_MAX_LENGTH;
  readonly descriptionMax = DESCRIPTION_MAX_LENGTH;
  readonly ecoreAccept = acceptOf(FILE_TYPES.ecore);
  readonly genmodelAccept = acceptOf(FILE_TYPES.genmodel);

  readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    description: ['', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
    ecoreFile: new FormControl<File | null>(null, [Validators.required, ...fileValidators(FILE_TYPES.ecore)]),
    genmodelFile: new FormControl<File | null>(null, fileValidators(FILE_TYPES.genmodel)),
  });
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  constructor() {
    // Sugiere el nombre a partir del archivo para ahorrar escritura.
    this.form.controls.ecoreFile.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((file) => {
      if (file && !this.form.controls.name.value) {
        this.form.controls.name.setValue(baseName(file));
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .create({
        name: value.name.trim(),
        description: optionalText(value.description),
        ecoreFile: value.ecoreFile!,
        genmodelFile: value.genmodelFile,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (metamodel) => this.dialogRef.close(metamodel),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }
}

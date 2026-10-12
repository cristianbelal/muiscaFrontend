import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { AtlModuleApi } from '../../../core/api/atl-module-api.service';
import { MetamodelApi } from '../../../core/api/metamodel-api.service';
import { WorkspaceApi } from '../../../core/api/workspace-api.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { AtlCompilation, AtlModule, Metamodel } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { ProblemListComponent } from '../../../shared/components/problem-list/problem-list.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, baseName, optionalText } from '../../../shared/forms/form-utils';

/**
 * Registro de un módulo ATL (POST /api/atl-modules). Permite verificar antes la compilación
 * con POST /api/workspace/atl/compile para ver la cabecera detectada y los problemas.
 */
@Component({
  selector: 'app-atl-module-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    FilePickerComponent,
    ProblemListComponent,
    ApiErrorPanelComponent,
  ],
  templateUrl: './atl-module-form-dialog.component.html',
})
export class AtlModuleFormDialogComponent implements OnInit {
  private readonly api = inject(AtlModuleApi);
  private readonly metamodelApi = inject(MetamodelApi);
  private readonly workspaceApi = inject(WorkspaceApi);
  private readonly dialogRef = inject<MatDialogRef<AtlModuleFormDialogComponent, AtlModule>>(MatDialogRef);

  readonly nameMax = NAME_MAX_LENGTH;
  readonly descriptionMax = DESCRIPTION_MAX_LENGTH;
  readonly atlAccept = acceptOf(FILE_TYPES.atl);

  readonly form = inject(NonNullableFormBuilder).group({
    atlFile: new FormControl<File | null>(null, [Validators.required, ...fileValidators(FILE_TYPES.atl)]),
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    description: ['', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
    sourceMetamodelId: new FormControl<number | null>(null, Validators.required),
    targetMetamodelId: new FormControl<number | null>(null, Validators.required),
  });

  readonly metamodels = signal<Metamodel[]>([]);
  readonly loadingMetamodels = signal(true);
  readonly compiling = signal(false);
  readonly compilation = signal<AtlCompilation | null>(null);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  constructor() {
    this.form.controls.atlFile.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((file) => {
      this.compilation.set(null);
      if (file && !this.form.controls.name.value) {
        this.form.controls.name.setValue(baseName(file));
      }
    });
  }

  ngOnInit(): void {
    this.metamodelApi
      .list()
      .pipe(finalize(() => this.loadingMetamodels.set(false)))
      .subscribe((metamodels) => this.metamodels.set(metamodels));
  }

  verify(): void {
    const control = this.form.controls.atlFile;
    if (!control.value || control.invalid) {
      control.markAsTouched();
      return;
    }
    this.compiling.set(true);
    this.error.set(null);
    this.workspaceApi
      .compileAtl(control.value)
      .pipe(finalize(() => this.compiling.set(false)))
      .subscribe({
        next: (compilation) => this.compilation.set(compilation),
        error: (error: unknown) => this.error.set(asApiError(error)),
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
        sourceMetamodelId: value.sourceMetamodelId!,
        targetMetamodelId: value.targetMetamodelId!,
        atlFile: value.atlFile!,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (module) => this.dialogRef.close(module),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }
}

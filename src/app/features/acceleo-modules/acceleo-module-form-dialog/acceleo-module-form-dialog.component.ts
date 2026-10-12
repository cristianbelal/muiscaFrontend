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
import { finalize, merge, switchMap } from 'rxjs';
import { AcceleoModuleApi } from '../../../core/api/acceleo-module-api.service';
import { MetamodelApi } from '../../../core/api/metamodel-api.service';
import { WorkspaceApi } from '../../../core/api/workspace-api.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { AcceleoModule, Metamodel, TemplateCompilation } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { ProblemListComponent } from '../../../shared/components/problem-list/problem-list.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, optionalText } from '../../../shared/forms/form-utils';

/**
 * Registro de una plantilla Acceleo (POST /api/acceleo-modules). La verificación previa usa
 * POST /api/workspace/acceleo/compile con el .ecore del metamodelo elegido.
 */
@Component({
  selector: 'app-acceleo-module-form-dialog',
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
  templateUrl: './acceleo-module-form-dialog.component.html',
})
export class AcceleoModuleFormDialogComponent implements OnInit {
  private readonly api = inject(AcceleoModuleApi);
  private readonly metamodelApi = inject(MetamodelApi);
  private readonly workspaceApi = inject(WorkspaceApi);
  private readonly dialogRef = inject<MatDialogRef<AcceleoModuleFormDialogComponent, AcceleoModule>>(MatDialogRef);

  readonly nameMax = NAME_MAX_LENGTH;
  readonly descriptionMax = DESCRIPTION_MAX_LENGTH;
  readonly templateAccept = acceptOf(FILE_TYPES.acceleo);

  readonly form = inject(NonNullableFormBuilder).group({
    templateFile: new FormControl<File | null>(null, [Validators.required, ...fileValidators(FILE_TYPES.acceleo)]),
    metamodelId: new FormControl<number | null>(null, Validators.required),
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    description: ['', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
  });

  readonly metamodels = signal<Metamodel[]>([]);
  readonly loadingMetamodels = signal(true);
  readonly compiling = signal(false);
  readonly compilation = signal<TemplateCompilation | null>(null);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  constructor() {
    // Una verificación deja de ser válida si cambia la plantilla o el metamodelo.
    merge(this.form.controls.templateFile.valueChanges, this.form.controls.metamodelId.valueChanges)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.compilation.set(null));
  }

  ngOnInit(): void {
    this.metamodelApi
      .list()
      .pipe(finalize(() => this.loadingMetamodels.set(false)))
      .subscribe((metamodels) => this.metamodels.set(metamodels));
  }

  verify(): void {
    const { templateFile, metamodelId } = this.form.controls;
    if (!templateFile.value || templateFile.invalid || metamodelId.value === null) {
      templateFile.markAsTouched();
      metamodelId.markAsTouched();
      return;
    }
    const template = templateFile.value;
    this.compiling.set(true);
    this.error.set(null);
    this.metamodelApi
      .fetchEcore(metamodelId.value)
      .pipe(
        switchMap((ecore) => this.workspaceApi.compileTemplate(ecore, template)),
        finalize(() => this.compiling.set(false)),
      )
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
        metamodelId: value.metamodelId!,
        templateFile: value.templateFile!,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (module) => this.dialogRef.close(module),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }
}

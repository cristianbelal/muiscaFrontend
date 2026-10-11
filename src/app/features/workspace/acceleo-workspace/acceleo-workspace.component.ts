import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import { WorkspaceApi } from '../../../core/api/workspace-api.service';
import { FileDownloadService, filenameFrom } from '../../../core/files/file-download.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { TemplateCompilation } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { ProblemListComponent } from '../../../shared/components/problem-list/problem-list.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';
import { baseName } from '../../../shared/forms/form-utils';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';

function fileControl(extensions: readonly string[]): FormControl<File | null> {
  return new FormControl<File | null>(null, [Validators.required, ...fileValidators(extensions)]);
}

/** Prueba de una plantilla Acceleo: POST /api/workspace/acceleo/compile y /acceleo/run (ZIP). */
@Component({
  selector: 'app-acceleo-workspace',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FilePickerComponent,
    ProblemListComponent,
    ApiErrorPanelComponent,
    FileSizePipe,
  ],
  templateUrl: './acceleo-workspace.component.html',
  styleUrl: '../workspace-panel.css',
})
export class AcceleoWorkspaceComponent {
  private readonly api = inject(WorkspaceApi);
  private readonly downloads = inject(FileDownloadService);

  readonly accept = {
    ecore: acceptOf(FILE_TYPES.ecore),
    mtl: acceptOf(FILE_TYPES.acceleo),
    model: acceptOf(FILE_TYPES.model),
  };

  readonly form = new FormGroup({
    templateFile: fileControl(FILE_TYPES.acceleo),
    metamodel: fileControl(FILE_TYPES.ecore),
    inputModel: fileControl(FILE_TYPES.model),
  });

  readonly busy = signal<'compile' | 'run' | null>(null);
  readonly compilation = signal<TemplateCompilation | null>(null);
  readonly archive = signal<{ blob: Blob; name: string } | null>(null);
  readonly error = signal<ApiError | null>(null);

  /** Compilar necesita la plantilla y el metamodelo contra el que se valida. */
  compile(): void {
    const { templateFile, metamodel } = this.form.controls;
    if (!templateFile.value || !metamodel.value || templateFile.invalid || metamodel.invalid) {
      templateFile.markAsTouched();
      metamodel.markAsTouched();
      return;
    }
    this.busy.set('compile');
    this.error.set(null);
    this.api
      .compileTemplate(metamodel.value, templateFile.value)
      .pipe(finalize(() => this.busy.set(null)))
      .subscribe({
        next: (compilation) => this.compilation.set(compilation),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }

  run(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.busy.set('run');
    this.error.set(null);
    this.archive.set(null);
    this.api
      .runTemplate({ metamodel: value.metamodel!, templateFile: value.templateFile!, inputModel: value.inputModel! })
      .pipe(finalize(() => this.busy.set(null)))
      .subscribe({
        next: (response) => {
          const archive = {
            blob: response.body ?? new Blob(),
            name:
              filenameFrom(response.headers.get('Content-Disposition')) ?? `${baseName(value.inputModel)}-codigo.zip`,
          };
          this.archive.set(archive);
          this.download();
        },
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }

  download(): void {
    const archive = this.archive();
    if (archive) {
      this.downloads.saveBlob(archive.blob, archive.name);
    }
  }
}

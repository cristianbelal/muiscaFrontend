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
import { AtlCompilation, GeneratedFile } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { CodeViewerComponent } from '../../../shared/components/code-viewer/code-viewer.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { ProblemListComponent } from '../../../shared/components/problem-list/problem-list.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';
import { RegisteredMetamodelSelectComponent } from '../registered-metamodel-select/registered-metamodel-select.component';
import { baseName } from '../../../shared/forms/form-utils';

function fileControl(extensions: readonly string[]): FormControl<File | null> {
  return new FormControl<File | null>(null, [Validators.required, ...fileValidators(extensions)]);
}

/**
 * Prueba de un módulo ATL (antes "atl-admin-view", que llamaba a un endpoint inexistente):
 * POST /api/workspace/atl/compile y POST /api/workspace/atl/run.
 */
@Component({
  selector: 'app-atl-workspace',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FilePickerComponent,
    RegisteredMetamodelSelectComponent,
    ProblemListComponent,
    ApiErrorPanelComponent,
    CodeViewerComponent,
  ],
  templateUrl: './atl-workspace.component.html',
  styleUrl: '../workspace-panel.css',
})
export class AtlWorkspaceComponent {
  private readonly api = inject(WorkspaceApi);
  private readonly downloads = inject(FileDownloadService);

  readonly accept = {
    ecore: acceptOf(FILE_TYPES.ecore),
    atl: acceptOf(FILE_TYPES.atl),
    model: acceptOf(FILE_TYPES.model),
  };

  readonly form = new FormGroup({
    atlFile: fileControl(FILE_TYPES.atl),
    sourceMetamodel: fileControl(FILE_TYPES.ecore),
    targetMetamodel: fileControl(FILE_TYPES.ecore),
    inputModel: fileControl(FILE_TYPES.model),
  });

  readonly busy = signal<'compile' | 'run' | null>(null);
  readonly compilation = signal<AtlCompilation | null>(null);
  readonly output = signal<{ blob: Blob; name: string; preview: GeneratedFile[] } | null>(null);
  readonly error = signal<ApiError | null>(null);

  /** Compilar solo necesita el .atl. */
  compile(): void {
    const control = this.form.controls.atlFile;
    if (!control.value || control.invalid) {
      control.markAsTouched();
      return;
    }
    this.start('compile');
    this.api
      .compileAtl(control.value)
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
    this.start('run');
    this.api
      .runAtl({
        sourceMetamodel: value.sourceMetamodel!,
        targetMetamodel: value.targetMetamodel!,
        atlFile: value.atlFile!,
        inputModel: value.inputModel!,
      })
      .pipe(finalize(() => this.busy.set(null)))
      .subscribe({
        next: async (response) => {
          const blob = response.body ?? new Blob();
          const name =
            filenameFrom(response.headers.get('Content-Disposition')) ?? `${baseName(value.inputModel)}-output.xmi`;
          this.output.set({ blob, name, preview: [{ path: name, content: await blob.text() }] });
        },
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }

  downloadOutput(): void {
    const output = this.output();
    if (output) {
      this.downloads.saveBlob(output.blob, output.name);
    }
  }

  private start(action: 'compile' | 'run'): void {
    this.busy.set(action);
    this.error.set(null);
    if (action === 'run') {
      this.output.set(null);
    }
  }
}

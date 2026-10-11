import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TransformationApi } from '../../../core/api/transformation-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { Execution, Transformation } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { ExecutionResultComponent } from '../../../shared/components/execution-result/execution-result.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TransformationChainComponent } from '../../../shared/components/transformation-chain/transformation-chain.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';

/**
 * Ejecuta una transformación del catálogo sobre el modelo del usuario
 * (POST /api/transformations/{id}/executions). Antes era un formulario sin conexión al backend.
 */
@Component({
  selector: 'app-execute-transformation',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
    FilePickerComponent,
    TransformationChainComponent,
    ApiErrorPanelComponent,
    ExecutionResultComponent,
  ],
  templateUrl: './execute-transformation.component.html',
  styleUrl: './execute-transformation.component.css',
})
export class ExecuteTransformationComponent implements OnInit {
  private readonly api = inject(TransformationApi);
  readonly canManageCatalog = inject(AuthService).canManageCatalog;

  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly modelAccept = acceptOf(FILE_TYPES.model);
  readonly inputModel = new FormControl<File | null>(null, [Validators.required, ...fileValidators(FILE_TYPES.model)]);

  readonly transformation = signal<Transformation | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly running = signal(false);
  readonly execution = signal<Execution | null>(null);
  readonly error = signal<ApiError | null>(null);

  ngOnInit(): void {
    this.api
      .get(Number(this.id()))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (transformation) => this.transformation.set(transformation),
        error: () => this.notFound.set(true),
      });
  }

  run(): void {
    const transformation = this.transformation();
    const file = this.inputModel.value;
    if (!transformation || !file || this.inputModel.invalid) {
      this.inputModel.markAsTouched();
      return;
    }
    this.running.set(true);
    this.error.set(null);
    this.execution.set(null);
    this.inputModel.disable();
    this.api
      .execute(transformation.id, file)
      .pipe(
        finalize(() => {
          this.running.set(false);
          this.inputModel.enable();
        }),
      )
      .subscribe({
        next: (execution) => this.execution.set(execution),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }

  reset(): void {
    this.execution.set(null);
    this.error.set(null);
    this.inputModel.reset();
  }
}

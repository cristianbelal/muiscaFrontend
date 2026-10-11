import { Component, ElementRef, OnInit, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { Observable, finalize, switchMap } from 'rxjs';
import { StoredModelApi } from '../../../core/api/stored-model-api.service';
import { TransformationApi } from '../../../core/api/transformation-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { NotificationService } from '../../../core/notifications/notification.service';
import { Execution, StoredModel, Transformation } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { ExecutionResultComponent } from '../../../shared/components/execution-result/execution-result.component';
import { FilePickerComponent } from '../../../shared/components/file-picker/file-picker.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TransformationChainComponent } from '../../../shared/components/transformation-chain/transformation-chain.component';
import { FILE_TYPES, acceptOf, fileValidators } from '../../../shared/forms/file-validators';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

type ModelSource = 'upload' | 'library';

/**
 * Ejecuta una transformación del catálogo (POST /api/transformations/{id}/executions) con un
 * modelo subido en el momento o uno de la biblioteca del usuario, y avisa del resultado.
 */
@Component({
  selector: 'app-execute-transformation',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
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
  private readonly modelApi = inject(StoredModelApi);
  private readonly notifications = inject(NotificationService);
  private readonly duration = new DurationPipe();
  readonly canManageCatalog = inject(AuthService).canManageCatalog;

  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly resultCard = viewChild<ElementRef<HTMLElement>>('resultCard');

  readonly modelAccept = acceptOf(FILE_TYPES.model);
  readonly inputModel = new FormControl<File | null>(null, [Validators.required, ...fileValidators(FILE_TYPES.model)]);
  readonly storedModelId = new FormControl<number | null>(null, Validators.required);

  readonly transformation = signal<Transformation | null>(null);
  readonly library = signal<StoredModel[]>([]);
  readonly source = signal<ModelSource>('upload');
  readonly saveToLibrary = signal(false);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly running = signal(false);
  readonly execution = signal<Execution | null>(null);
  readonly error = signal<ApiError | null>(null);

  /** Solo los modelos guardados que esta transformación puede recibir. */
  readonly compatibleModels = computed(() => {
    const input = this.transformation()?.inputMetamodel.id;
    return this.library().filter((m) => m.metamodel.id === input);
  });

  ngOnInit(): void {
    this.api
      .get(Number(this.id()))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (transformation) => {
          this.transformation.set(transformation);
          this.loadLibrary();
        },
        error: () => this.notFound.set(true),
      });
  }

  setSource(source: ModelSource): void {
    this.source.set(source);
    this.error.set(null);
  }

  run(): void {
    const transformation = this.transformation();
    const control = this.source() === 'upload' ? this.inputModel : this.storedModelId;
    if (!transformation || control.invalid) {
      control.markAsTouched();
      return;
    }
    this.running.set(true);
    this.error.set(null);
    this.execution.set(null);
    control.disable();
    this.request(transformation)
      .pipe(
        finalize(() => {
          this.running.set(false);
          control.enable();
        }),
      )
      .subscribe({
        next: (execution) => this.showResult(execution),
        error: (error: unknown) => {
          const apiError = asApiError(error);
          this.error.set(apiError);
          this.notifications.error(`No se pudo ejecutar la transformación: ${apiError.message}`);
        },
      });
  }

  reset(): void {
    this.execution.set(null);
    this.error.set(null);
    this.inputModel.reset();
    this.storedModelId.reset();
  }

  /** Sube el archivo o usa el modelo guardado; si se pidió, guarda antes el archivo en la biblioteca. */
  private request(transformation: Transformation): Observable<Execution> {
    if (this.source() === 'library') {
      return this.api.executeStoredModel(transformation.id, this.storedModelId.value!);
    }
    const file = this.inputModel.value!;
    if (!this.saveToLibrary()) {
      return this.api.execute(transformation.id, file);
    }
    return this.modelApi.create({ modelFile: file, name: null, description: null }).pipe(
      switchMap((saved) => {
        this.library.update((list) => [...list, saved]);
        this.notifications.info(`Modelo "${saved.name}" guardado en su biblioteca.`);
        return this.api.executeStoredModel(transformation.id, saved.id);
      }),
    );
  }

  private showResult(execution: Execution): void {
    this.execution.set(execution);
    if (execution.status === 'SUCCEEDED') {
      const outputs = [
        execution.outputModelName ? 'el modelo transformado' : null,
        execution.generatedFiles.length ? `${execution.generatedFiles.length} archivo(s) de código` : null,
      ].filter(Boolean);
      this.notifications.success(
        `Transformación exitosa en ${this.duration.transform(execution.durationMs)}` +
          (outputs.length ? `: se generó ${outputs.join(' y ')}.` : '.'),
      );
    } else {
      this.notifications.error('La transformación falló. Revise el detalle del error en el resultado.');
    }
    // Lleva la vista al resultado cuando se termina de dibujar.
    setTimeout(() => this.resultCard()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private loadLibrary(): void {
    // La biblioteca es opcional: si no carga, el usuario aún puede subir el archivo.
    this.modelApi.list().subscribe({ next: (models) => this.library.set(models), error: () => this.library.set([]) });
  }
}

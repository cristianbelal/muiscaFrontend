import { Component, DestroyRef, ElementRef, OnInit, computed, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ExecutionApi } from '../../../core/api/execution-api.service';
import { SampleApi } from '../../../core/api/sample-api.service';
import { StoredModelApi } from '../../../core/api/stored-model-api.service';
import { TransformationApi } from '../../../core/api/transformation-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { NotificationService } from '../../../core/notifications/notification.service';
import { Execution, SampleModel, StoredModel, Transformation } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { ExecutionProgressComponent } from '../../../shared/components/execution-progress/execution-progress.component';
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
    ExecutionProgressComponent,
  ],
  templateUrl: './execute-transformation.component.html',
  styleUrl: './execute-transformation.component.css',
})
export class ExecuteTransformationComponent implements OnInit {
  private readonly api = inject(TransformationApi);
  private readonly modelApi = inject(StoredModelApi);
  private readonly executionApi = inject(ExecutionApi);
  private readonly sampleApi = inject(SampleApi);
  private readonly destroyRef = inject(DestroyRef);
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
  readonly samples = signal<SampleModel[]>([]);
  readonly loadingSample = signal(false);
  /** Ejecución en curso (RUNNING) mientras se consulta su avance. */
  readonly progress = signal<Execution | null>(null);
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

  /** Modelos de ejemplo del metamodelo de entrada, para probar sin un modelo propio. */
  readonly compatibleSamples = computed(() => {
    const input = this.transformation()?.inputMetamodel.id;
    return this.samples().filter((s) => s.metamodel.id === input);
  });

  ngOnInit(): void {
    this.api
      .get(Number(this.id()))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (transformation) => {
          this.transformation.set(transformation);
          this.loadLibrary();
          this.sampleApi.list().subscribe({ next: (samples) => this.samples.set(samples), error: () => undefined });
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
    this.progress.set(null);
    control.disable();
    // Se inicia en segundo plano y se consulta el avance hasta que termina (aunque tarde minutos).
    this.request(transformation)
      .pipe(
        switchMap((started) => this.executionApi.watch(started.id)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.running.set(false);
          this.progress.set(null);
          control.enable();
        }),
      )
      .subscribe({
        next: (execution) =>
          execution.status === 'RUNNING' ? this.progress.set(execution) : this.showResult(execution),
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

  /** Carga un modelo de ejemplo como si el usuario lo hubiera subido. */
  useSample(sample: SampleModel): void {
    this.loadingSample.set(true);
    this.sampleApi
      .fetch(sample)
      .pipe(finalize(() => this.loadingSample.set(false)))
      .subscribe((file) => {
        this.setSource('upload');
        this.inputModel.setValue(file);
        this.inputModel.markAsTouched();
        this.notifications.info(`Se cargó el modelo de ejemplo ${sample.fileName}. Ahora pulse Ejecutar.`);
      });
  }

  /** Sube el archivo o usa el modelo guardado; si se pidió, guarda antes el archivo en la biblioteca. */
  private request(transformation: Transformation): Observable<Execution> {
    if (this.source() === 'library') {
      return this.api.start(transformation.id, { modelId: this.storedModelId.value! });
    }
    const file = this.inputModel.value!;
    if (!this.saveToLibrary()) {
      return this.api.start(transformation.id, { inputModel: file });
    }
    return this.modelApi.create({ modelFile: file, name: null, description: null }).pipe(
      switchMap((saved) => {
        this.library.update((list) => [...list, saved]);
        this.notifications.info(`Modelo "${saved.name}" guardado en su biblioteca.`);
        return this.api.start(transformation.id, { modelId: saved.id });
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

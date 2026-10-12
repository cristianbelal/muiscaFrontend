import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, merge, startWith } from 'rxjs';
import { AcceleoModuleApi } from '../../../core/api/acceleo-module-api.service';
import { AtlModuleApi } from '../../../core/api/atl-module-api.service';
import { MetamodelApi } from '../../../core/api/metamodel-api.service';
import { TransformationApi } from '../../../core/api/transformation-api.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { AcceleoModule, AtlModule, Metamodel, Transformation, TransformationRequest } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import {
  ChainParts,
  TransformationChainComponent,
} from '../../../shared/components/transformation-chain/transformation-chain.component';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, optionalText } from '../../../shared/forms/form-utils';

export interface TransformationFormDialogData {
  /** Si viene, se edita; si no, se crea una nueva. */
  transformation?: Transformation;
}

/** Al menos una de las dos etapas es obligatoria (dto/TransformationRequest.java). */
function atLeastOneStage(group: AbstractControl): ValidationErrors | null {
  const atl = group.get('atlModuleId')?.value;
  const acceleo = group.get('acceleoModuleId')?.value;
  return atl === null && acceleo === null ? { noStage: true } : null;
}

/**
 * Crea o edita una opción del catálogo (POST/PUT /api/transformations). Solo ofrece los
 * módulos compatibles, replicando TransformationService.validateChain del backend.
 */
@Component({
  selector: 'app-transformation-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    TransformationChainComponent,
    ApiErrorPanelComponent,
  ],
  templateUrl: './transformation-form-dialog.component.html',
})
export class TransformationFormDialogComponent implements OnInit {
  private readonly api = inject(TransformationApi);
  private readonly metamodelApi = inject(MetamodelApi);
  private readonly atlApi = inject(AtlModuleApi);
  private readonly acceleoApi = inject(AcceleoModuleApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject<MatDialogRef<TransformationFormDialogComponent, Transformation>>(MatDialogRef);
  readonly data = inject<TransformationFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.transformation;
  readonly nameMax = NAME_MAX_LENGTH;
  readonly descriptionMax = DESCRIPTION_MAX_LENGTH;

  readonly form = inject(NonNullableFormBuilder).group(
    {
      name: [this.data.transformation?.name ?? '', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
      description: [this.data.transformation?.description ?? '', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
      inputMetamodelId: new FormControl<number | null>(
        this.data.transformation?.inputMetamodel.id ?? null,
        Validators.required,
      ),
      atlModuleId: new FormControl<number | null>(this.data.transformation?.atlModule?.id ?? null),
      acceleoModuleId: new FormControl<number | null>(this.data.transformation?.acceleoModule?.id ?? null),
    },
    { validators: atLeastOneStage },
  );

  readonly metamodels = signal<Metamodel[]>([]);
  readonly atlModules = signal<AtlModule[]>([]);
  readonly acceleoModules = signal<AcceleoModule[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly value = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly selectedAtl = computed(() => this.atlModules().find((m) => m.id === this.value().atlModuleId) ?? null);

  /** Módulos ATL que reciben modelos del metamodelo de entrada. */
  readonly availableAtl = computed(() =>
    this.atlModules().filter((m) => m.sourceMetamodel.id === this.value().inputMetamodelId),
  );

  /** Metamodelo que recibe la etapa Acceleo: la salida del ATL o, sin ATL, la entrada. */
  readonly codeInputMetamodelId = computed(
    () => this.selectedAtl()?.targetMetamodel.id ?? this.value().inputMetamodelId ?? null,
  );

  readonly availableAcceleo = computed(() =>
    this.acceleoModules().filter((m) => m.metamodel.id === this.codeInputMetamodelId()),
  );

  readonly codeInputName = computed(
    () => this.metamodels().find((m) => m.id === this.codeInputMetamodelId())?.name ?? '',
  );

  readonly preview = computed<ChainParts>(() => {
    const value = this.value();
    const input = this.metamodels().find((m) => m.id === value.inputMetamodelId);
    const atl = this.selectedAtl();
    const acceleo = this.acceleoModules().find((m) => m.id === value.acceleoModuleId);
    return {
      inputMetamodel: input ? { id: input.id, name: input.name } : null,
      atlModule: atl ? { id: atl.id, name: atl.name } : null,
      outputMetamodel: atl?.targetMetamodel ?? null,
      acceleoModule: acceleo ? { id: acceleo.id, name: acceleo.name } : null,
    };
  });

  constructor() {
    const { inputMetamodelId, atlModuleId } = this.form.controls;
    // Al cambiar una etapa se descartan las selecciones posteriores que ya no encajan.
    merge(inputMetamodelId.valueChanges, atlModuleId.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reconcileStages());
  }

  ngOnInit(): void {
    forkJoin({
      metamodels: this.metamodelApi.list(),
      atl: this.atlApi.list(),
      acceleo: this.acceleoApi.list(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ metamodels, atl, acceleo }) => {
        this.metamodels.set(metamodels);
        this.atlModules.set(atl);
        this.acceleoModules.set(acceleo);
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request: TransformationRequest = {
      name: value.name.trim(),
      description: optionalText(value.description),
      inputMetamodelId: value.inputMetamodelId!,
      atlModuleId: value.atlModuleId,
      acceleoModuleId: value.acceleoModuleId,
    };
    const existing = this.data.transformation;
    this.saving.set(true);
    this.error.set(null);
    (existing ? this.api.update(existing.id, request) : this.api.create(request))
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (transformation) => this.dialogRef.close(transformation),
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }

  /**
   * Lee los controles directamente (no el signal del formulario): el valueChanges de un
   * control se emite antes de que el grupo actualice su valor.
   */
  private reconcileStages(): void {
    const { inputMetamodelId, atlModuleId, acceleoModuleId } = this.form.controls;
    let atl = this.atlModules().find((m) => m.id === atlModuleId.value) ?? null;
    if (atl && atl.sourceMetamodel.id !== inputMetamodelId.value) {
      atl = null;
      atlModuleId.setValue(null, { emitEvent: false });
    }
    const codeInputId = atl?.targetMetamodel.id ?? inputMetamodelId.value;
    const acceleo = this.acceleoModules().find((m) => m.id === acceleoModuleId.value);
    if (acceleo && acceleo.metamodel.id !== codeInputId) {
      acceleoModuleId.setValue(null);
    } else {
      // Refresca la vista previa aunque solo haya cambiado el ATL silenciosamente.
      this.form.updateValueAndValidity();
    }
  }
}

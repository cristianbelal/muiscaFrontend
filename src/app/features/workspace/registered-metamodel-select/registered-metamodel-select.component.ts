import { Component, inject, input, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { MetamodelApi } from '../../../core/api/metamodel-api.service';
import { Metamodel } from '../../../core/models';

/**
 * Alternativa a subir un .ecore en el espacio de trabajo: elegir un metamodelo del catálogo.
 * Descarga su archivo (GET /api/metamodels/{id}/ecore) y lo asigna al control del formulario,
 * de modo que el selector de archivos muestra el .ecore elegido.
 */
@Component({
  selector: 'app-registered-metamodel-select',
  imports: [MatFormFieldModule, MatSelectModule, MatProgressBarModule],
  template: `
    @if (metamodels().length) {
      <mat-form-field class="full-width select">
        <mat-label>o use un metamodelo registrado</mat-label>
        <mat-select [value]="selectedId()" (selectionChange)="pick($event)" [disabled]="loading()">
          @for (metamodel of metamodels(); track metamodel.id) {
            <mat-option [value]="metamodel.id">{{ metamodel.name }} · {{ metamodel.ecoreFileName }}</mat-option>
          }
        </mat-select>
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" aria-label="Descargando el metamodelo" />
        }
      </mat-form-field>
    }
  `,
  styles: `
    .select {
      margin: -8px 0 8px;
    }
  `,
})
export class RegisteredMetamodelSelectComponent {
  private readonly api = inject(MetamodelApi);

  /** Control del .ecore al que se asigna el archivo del metamodelo elegido. */
  readonly control = input.required<FormControl<File | null>>();

  readonly metamodels = signal<Metamodel[]>([]);
  readonly selectedId = signal<number | null>(null);
  readonly loading = signal(false);

  constructor() {
    this.api.list().subscribe({ next: (metamodels) => this.metamodels.set(metamodels), error: () => undefined });
  }

  pick(event: MatSelectChange): void {
    const metamodel = this.metamodels().find((m) => m.id === event.value);
    if (!metamodel) {
      return;
    }
    this.selectedId.set(metamodel.id);
    this.loading.set(true);
    this.api
      .fetchEcore(metamodel.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((file) => {
        const named = new File([file], metamodel.ecoreFileName, { type: file.type });
        this.control().setValue(named);
        this.control().markAsTouched();
      });
  }
}

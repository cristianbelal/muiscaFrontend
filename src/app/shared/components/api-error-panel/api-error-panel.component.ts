import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ApiError } from '../../../core/http/api-error';
import { ProblemListComponent } from '../problem-list/problem-list.component';

/**
 * Error de la API dentro de un formulario: mensaje del backend, errores de validación de
 * campos y, si los hay, los problemas de compilación del artefacto.
 */
@Component({
  selector: 'app-api-error-panel',
  imports: [MatIconModule, ProblemListComponent],
  template: `
    @if (error(); as e) {
      <div class="panel" role="alert">
        <div class="callout error">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <div>
            <p>{{ e.message }}</p>
            @if (e.fieldErrors.length) {
              <ul>
                @for (fieldError of e.fieldErrors; track $index) {
                  <li>{{ fieldError }}</li>
                }
              </ul>
            }
          </div>
        </div>
        <app-problem-list [problems]="e.problems" />
      </div>
    }
  `,
  styles: `
    .panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    ul {
      margin: 6px 0 0;
      padding-left: 20px;
    }
  `,
})
export class ApiErrorPanelComponent {
  readonly error = input<ApiError | null>(null);
}

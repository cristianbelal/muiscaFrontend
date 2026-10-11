import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ArtifactProblem } from '../../../core/models';

/**
 * Errores y advertencias de compilación/validación, al estilo de la vista "Problems" de
 * Eclipse que imita el backend (ArtifactProblem). Primero los errores, luego por línea.
 */
@Component({
  selector: 'app-problem-list',
  imports: [MatIconModule],
  template: `
    @if (sorted().length) {
      <section class="problems" [attr.aria-label]="heading()">
        <h3>
          {{ heading() }}
          <span class="counts">
            @if (errorCount()) {
              <span class="badge badge-error">{{ errorCount() }} {{ errorCount() === 1 ? 'error' : 'errores' }}</span>
            }
            @if (warningCount()) {
              <span class="badge badge-warning">
                {{ warningCount() }} {{ warningCount() === 1 ? 'advertencia' : 'advertencias' }}
              </span>
            }
          </span>
        </h3>
        <ul>
          @for (problem of sorted(); track $index) {
            <li [class.error]="problem.severity === 'ERROR'">
              <mat-icon aria-hidden="true">{{ problem.severity === 'ERROR' ? 'error' : 'warning' }}</mat-icon>
              <span class="visually-hidden">{{ problem.severity === 'ERROR' ? 'Error' : 'Advertencia' }}:</span>
              @if (problem.line !== null && problem.line !== undefined) {
                <span class="line">Línea {{ problem.line }}</span>
              }
              <span class="message">{{ problem.message }}</span>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .problems {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--muisca-radius);
      overflow: hidden;
    }
    h3 {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 10px 16px;
      font: var(--mat-sys-title-small);
      background: var(--mat-sys-surface-container);
    }
    .counts {
      display: inline-flex;
      gap: 6px;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 280px;
      overflow: auto;
    }
    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      color: var(--muisca-warning);
    }
    li.error {
      color: var(--mat-sys-error);
    }
    li mat-icon {
      flex: none;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .line {
      flex: none;
      font-weight: 500;
    }
    .message {
      color: var(--mat-sys-on-surface);
      white-space: pre-wrap;
      word-break: break-word;
    }
  `,
})
export class ProblemListComponent {
  readonly problems = input<ArtifactProblem[] | null | undefined>([]);
  readonly heading = input('Problemas encontrados');

  readonly sorted = computed(() =>
    [...(this.problems() ?? [])].sort(
      (a, b) =>
        Number(b.severity === 'ERROR') - Number(a.severity === 'ERROR') || (a.line ?? 0) - (b.line ?? 0),
    ),
  );
  readonly errorCount = computed(() => this.sorted().filter((p) => p.severity === 'ERROR').length);
  readonly warningCount = computed(() => this.sorted().length - this.errorCount());
}

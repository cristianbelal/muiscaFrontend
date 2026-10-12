import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ExecutionStage } from '../../../core/models';

interface Step {
  key: ExecutionStage;
  label: string;
}

/**
 * Progreso de una ejecución en segundo plano: las etapas que tiene la transformación (en cola,
 * ATL, Acceleo) con la actual resaltada. Se alimenta del campo stage que informa el backend.
 */
@Component({
  selector: 'app-execution-progress',
  imports: [MatIconModule, MatProgressBarModule],
  template: `
    <div class="progress" role="status" aria-live="polite">
      <ol class="steps">
        @for (step of steps(); track step.key; let i = $index) {
          <li [class.done]="i < currentIndex()" [class.current]="i === currentIndex()">
            <mat-icon aria-hidden="true">
              {{ i < currentIndex() ? 'check_circle' : i === currentIndex() ? 'autorenew' : 'radio_button_unchecked' }}
            </mat-icon>
            <span>{{ step.label }}</span>
            @if (i === currentIndex()) {
              <span class="visually-hidden">(en curso)</span>
            }
          </li>
        }
      </ol>
      <mat-progress-bar mode="determinate" [value]="percent()" aria-label="Avance de la transformación" />
      <p class="muted small">
        Paso {{ currentIndex() + 1 }} de {{ steps().length }}. Puede salir de esta página: el resultado quedará en
        su historial.
      </p>
    </div>
  `,
  styles: `
    .steps {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 24px;
      margin: 0 0 12px;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-on-surface-variant);
    }
    li.done {
      color: var(--muisca-success);
    }
    li.current {
      color: var(--mat-sys-primary);
      font-weight: 500;
    }
    li.current mat-icon {
      animation: spin 1.2s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    p {
      margin: 8px 0 0;
    }
  `,
})
export class ExecutionProgressComponent {
  readonly stage = input<ExecutionStage | null>(null);
  readonly hasAtl = input(false);
  readonly hasAcceleo = input(false);

  readonly steps = computed<Step[]>(() => [
    { key: 'QUEUED', label: 'Modelo validado, en cola' },
    ...(this.hasAtl() ? [{ key: 'ATL' as const, label: 'Transformando el modelo (ATL)' }] : []),
    ...(this.hasAcceleo() ? [{ key: 'ACCELEO' as const, label: 'Generando el código (Acceleo)' }] : []),
  ]);

  readonly currentIndex = computed(() => Math.max(0, this.steps().findIndex((s) => s.key === this.stage())));

  /** Avance aproximado: cada etapa completada suma su parte; la actual cuenta la mitad. */
  readonly percent = computed(() => ((this.currentIndex() + 0.5) / this.steps().length) * 100);
}

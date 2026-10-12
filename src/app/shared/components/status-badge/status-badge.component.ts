import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ExecutionStage, ExecutionStatus } from '../../../core/models';

/** Texto de cada etapa de una ejecución en curso. */
export const STAGE_LABELS: Record<ExecutionStage, string> = {
  QUEUED: 'En cola',
  ATL: 'Transformando el modelo',
  ACCELEO: 'Generando el código',
};

/** Estado de una ejecución con color e icono (no depende solo del color, por accesibilidad). */
@Component({
  selector: 'app-status-badge',
  imports: [MatIconModule],
  template: `
    @switch (status()) {
      @case ('SUCCEEDED') {
        <span class="badge badge-success"><mat-icon aria-hidden="true">check_circle</mat-icon>Exitosa</span>
      }
      @case ('RUNNING') {
        <span class="badge badge-primary">
          <mat-icon aria-hidden="true" class="spin">autorenew</mat-icon>
          {{ stage() ? labels[stage()!] : 'En curso' }}
        </span>
      }
      @default {
        <span class="badge badge-error"><mat-icon aria-hidden="true">cancel</mat-icon>Fallida</span>
      }
    }
  `,
  styles: `
    .spin {
      animation: spin 1.2s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ExecutionStatus>();
  readonly stage = input<ExecutionStage | null>(null);
  readonly labels = STAGE_LABELS;
}

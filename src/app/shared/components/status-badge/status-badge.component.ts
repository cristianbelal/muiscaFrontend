import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ExecutionStatus } from '../../../core/models';

/** Estado de una ejecución con color e icono (no depende solo del color, por accesibilidad). */
@Component({
  selector: 'app-status-badge',
  imports: [MatIconModule],
  template: `
    @if (status() === 'SUCCEEDED') {
      <span class="badge badge-success"><mat-icon aria-hidden="true">check_circle</mat-icon>Exitosa</span>
    } @else {
      <span class="badge badge-error"><mat-icon aria-hidden="true">cancel</mat-icon>Fallida</span>
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ExecutionStatus>();
}

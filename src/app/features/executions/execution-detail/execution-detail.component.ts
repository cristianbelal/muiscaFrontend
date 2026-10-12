import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';
import { ExecutionApi } from '../../../core/api/execution-api.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { Execution } from '../../../core/models';
import { ExecutionResultComponent } from '../../../shared/components/execution-result/execution-result.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';

/** Detalle de una ejecución (GET /api/executions/{id}) con sus artefactos y el código generado. */
@Component({
  selector: 'app-execution-detail',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
    ExecutionResultComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page page-narrow">
      <a mat-button routerLink="/ejecuciones" class="back">
        <mat-icon>arrow_back</mat-icon>
        Volver al historial
      </a>
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Cargando la ejecución" />
      } @else if (execution()) {
        @let current = execution()!;
        <app-page-header [heading]="'Ejecución #' + current.id" icon="receipt_long" [subtitle]="current.transformationName">
          @if (current.transformationId) {
            <a mat-stroked-button [routerLink]="['/catalogo', current.transformationId, 'ejecutar']">
              <mat-icon>replay</mat-icon>
              Ejecutar de nuevo
            </a>
          }
          <button mat-stroked-button type="button" class="danger" (click)="delete(current)">
            <mat-icon>delete</mat-icon>
            Eliminar
          </button>
        </app-page-header>
        <mat-card appearance="outlined">
          <mat-card-content>
            @if (current.status === 'RUNNING') {
              <div class="running" role="status" aria-live="polite">
                <app-status-badge [status]="current.status" [stage]="current.stage" />
                <span class="muted">La transformación sigue en curso; esta página se actualiza sola.</span>
              </div>
              <mat-progress-bar mode="indeterminate" aria-label="Transformación en curso" />
            }
            <app-execution-result [execution]="current" />
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="callout error" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>La ejecución no existe o no tiene permiso para verla.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .back {
      margin: 0 0 12px -8px;
    }
    .running {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .danger {
      --mdc-outlined-button-label-text-color: var(--mat-sys-error);
    }
  `,
})
export class ExecutionDetailComponent implements OnInit {
  private readonly api = inject(ExecutionApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();
  readonly execution = signal<Execution | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api
      .get(Number(this.id()))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (execution) => {
          this.execution.set(execution);
          if (execution.status === 'RUNNING') {
            this.follow(execution.id);
          }
        },
        error: () => this.execution.set(null),
      });
  }

  /** Mientras siga en curso, se actualiza hasta que termine. */
  private follow(id: number): void {
    this.api
      .watch(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((execution) => this.execution.set(execution));
  }

  delete(execution: Execution): void {
    this.dialogs
      .confirm({
        title: 'Eliminar ejecución',
        message: 'Se eliminarán la ejecución y todos sus archivos (modelos y código generado).',
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(execution.id)),
      )
      .subscribe(() => {
        this.notifications.success('Ejecución eliminada.');
        this.router.navigateByUrl('/ejecuciones');
      });
  }
}

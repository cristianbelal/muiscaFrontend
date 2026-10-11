import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';
import { ExecutionApi } from '../../../core/api/execution-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ExecutionStatus, ExecutionSummary } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

type StatusFilter = 'ALL' | ExecutionStatus;

/** Historial (GET /api/executions): cada usuario ve las suyas y el administrador, todas. */
@Component({
  selector: 'app-execution-list',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    DurationPipe,
  ],
  templateUrl: './execution-list.component.html',
})
export class ExecutionListComponent implements OnInit {
  private readonly api = inject(ExecutionApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  readonly isAdmin = inject(AuthService).isAdmin;

  readonly executions = signal<ExecutionSummary[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly status = signal<StatusFilter>('ALL');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly columns = computed(() =>
    this.isAdmin()
      ? ['createdAt', 'transformation', 'executedBy', 'input', 'status', 'duration', 'actions']
      : ['createdAt', 'transformation', 'input', 'status', 'duration', 'actions'],
  );

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    return this.executions().filter(
      (e) =>
        (status === 'ALL' || e.status === status) &&
        (!term ||
          [e.transformationName, e.inputModelName, e.executedBy].some((value) => value.toLowerCase().includes(term))),
    );
  });

  readonly page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((executions) => this.executions.set(executions));
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
  }

  setStatus(value: StatusFilter): void {
    this.status.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  open(execution: ExecutionSummary): void {
    this.router.navigate(['/ejecuciones', execution.id]);
  }

  delete(execution: ExecutionSummary, event: Event): void {
    event.stopPropagation();
    this.dialogs
      .confirm({
        title: 'Eliminar ejecución',
        message: `Se eliminará la ejecución de "${execution.transformationName}" con el modelo ${execution.inputModelName}, junto con sus archivos generados.`,
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(execution.id)),
      )
      .subscribe(() => {
        this.executions.update((list) => list.filter((e) => e.id !== execution.id));
        this.notifications.success('Ejecución eliminada.');
      });
  }
}

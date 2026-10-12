import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { Subject, debounceTime, distinctUntilChanged, filter, finalize, switchMap } from 'rxjs';
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

const SEARCH_DEBOUNCE_MS = 350;

/**
 * Historial (GET /api/executions/search): cada usuario ve las suyas y el administrador, todas.
 * La paginación, el filtro por estado y la búsqueda se resuelven en el servidor.
 */
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput = new Subject<string>();
  readonly isAdmin = inject(AuthService).isAdmin;

  readonly executions = signal<ExecutionSummary[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly status = signal<StatusFilter>('ALL');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  /** Sin filtros y sin resultados: el usuario aún no ha ejecutado nada. */
  readonly neverExecuted = computed(
    () => !this.loading() && this.total() === 0 && !this.search().trim() && this.status() === 'ALL',
  );

  readonly columns = computed(() =>
    this.isAdmin()
      ? ['createdAt', 'transformation', 'executedBy', 'input', 'status', 'duration', 'actions']
      : ['createdAt', 'transformation', 'input', 'status', 'duration', 'actions'],
  );

  ngOnInit(): void {
    this.searchInput
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.load();
      });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .search({
        page: this.pageIndex(),
        size: this.pageSize(),
        status: this.status() === 'ALL' ? null : (this.status() as ExecutionStatus),
        q: this.search(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((page) => {
        this.executions.set(page.content);
        this.total.set(page.totalElements);
      });
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.searchInput.next(value);
  }

  setStatus(value: StatusFilter): void {
    this.status.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
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
        this.notifications.success('Ejecución eliminada.');
        // Si era el último de la página, se vuelve a la anterior.
        if (this.executions().length === 1 && this.pageIndex() > 0) {
          this.pageIndex.update((page) => page - 1);
        }
        this.load();
      });
  }
}

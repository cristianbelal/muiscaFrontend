import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, switchMap } from 'rxjs';
import { MetamodelApi } from '../../../core/api/metamodel-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { Metamodel } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';
import { MetamodelFormDialogComponent } from '../metamodel-form-dialog/metamodel-form-dialog.component';

/** Gestión de metamodelos Ecore (/api/metamodels). */
@Component({
  selector: 'app-metamodel-list',
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './metamodel-list.component.html',
})
export class MetamodelListComponent implements OnInit {
  private readonly api = inject(MetamodelApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly columns = ['name', 'nsUri', 'files', 'createdBy', 'createdAt', 'actions'];
  readonly metamodels = signal<Metamodel[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.metamodels().filter(
      (m) => !term || [m.name, m.description ?? '', m.nsUri].some((value) => value.toLowerCase().includes(term)),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((metamodels) => this.metamodels.set(metamodels));
  }

  canModify(metamodel: Metamodel): boolean {
    return this.auth.canModify(metamodel.createdBy);
  }

  create(): void {
    this.dialogs
      .openForm<MetamodelFormDialogComponent, void, Metamodel>(MetamodelFormDialogComponent, undefined)
      .pipe(filter((metamodel): metamodel is Metamodel => !!metamodel))
      .subscribe((metamodel) => {
        this.notifications.success(`Metamodelo "${metamodel.name}" registrado.`);
        this.dialogs.showWarnings(
          'Metamodelo registrado con advertencias',
          'El metamodelo se guardó, pero el validador de Ecore reportó lo siguiente:',
          metamodel.warnings,
        );
        this.load();
      });
  }

  editMetadata(metamodel: Metamodel): void {
    this.dialogs
      .editMetadata({
        title: `Editar ${metamodel.name}`,
        name: metamodel.name,
        description: metamodel.description,
        save: (request) => this.api.updateMetadata(metamodel.id, request),
      })
      .subscribe((updated) => {
        this.metamodels.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
        this.notifications.success('Metamodelo actualizado.');
      });
  }

  download(metamodel: Metamodel): void {
    this.api.downloadEcore(metamodel).subscribe();
  }

  delete(metamodel: Metamodel): void {
    this.dialogs
      .confirm({
        title: 'Eliminar metamodelo',
        message: `¿Eliminar "${metamodel.name}"? Solo es posible si ningún módulo ni transformación lo usa.`,
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(metamodel.id)),
      )
      .subscribe(() => {
        this.metamodels.update((list) => list.filter((m) => m.id !== metamodel.id));
        this.notifications.success('Metamodelo eliminado.');
      });
  }
}

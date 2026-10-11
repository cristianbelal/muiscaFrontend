import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { filter, finalize, switchMap } from 'rxjs';
import { AcceleoModuleApi } from '../../../core/api/acceleo-module-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AcceleoModule } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';
import {
  SourceUpdateDialogComponent,
  SourceUpdateDialogData,
} from '../../../shared/dialogs/source-update-dialog.component';
import { FILE_TYPES } from '../../../shared/forms/file-validators';
import { AcceleoModuleFormDialogComponent } from '../acceleo-module-form-dialog/acceleo-module-form-dialog.component';

/** Gestión de plantillas Acceleo modelo-a-texto (/api/acceleo-modules). */
@Component({
  selector: 'app-acceleo-module-list',
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './acceleo-module-list.component.html',
})
export class AcceleoModuleListComponent implements OnInit {
  private readonly api = inject(AcceleoModuleApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly columns = ['name', 'metamodel', 'mainTemplate', 'createdBy', 'updatedAt', 'actions'];
  readonly modules = signal<AcceleoModule[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.modules().filter(
      (m) =>
        !term ||
        [m.name, m.moduleName, m.description ?? '', m.metamodel.name].some((value) =>
          value.toLowerCase().includes(term),
        ),
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
      .subscribe((modules) => this.modules.set(modules));
  }

  canModify(module: AcceleoModule): boolean {
    return this.auth.canModify(module.createdBy);
  }

  create(): void {
    this.dialogs
      .openForm<AcceleoModuleFormDialogComponent, void, AcceleoModule>(
        AcceleoModuleFormDialogComponent,
        undefined,
        '720px',
      )
      .pipe(filter((module): module is AcceleoModule => !!module))
      .subscribe((module) => this.afterSave(module, `Plantilla "${module.name}" registrada.`));
  }

  updateSource(module: AcceleoModule): void {
    this.dialogs
      .openForm<SourceUpdateDialogComponent<AcceleoModule>, SourceUpdateDialogData<AcceleoModule>, AcceleoModule>(
        SourceUpdateDialogComponent,
        {
          title: `Actualizar plantilla ${module.name}`,
          description: `Suba la nueva versión del archivo .mtl. Se compila contra el metamodelo ${module.metamodel.name} antes de reemplazar la actual.`,
          label: 'Nueva plantilla (.mtl)',
          extensions: FILE_TYPES.acceleo,
          upload: (file) => this.api.updateSource(module.id, file),
        },
      )
      .pipe(filter((updated): updated is AcceleoModule => !!updated))
      .subscribe((updated) => this.afterSave(updated, `Plantilla "${updated.name}" actualizada.`));
  }

  download(module: AcceleoModule): void {
    this.api.downloadSource(module).subscribe();
  }

  delete(module: AcceleoModule): void {
    this.dialogs
      .confirm({
        title: 'Eliminar plantilla Acceleo',
        message: `¿Eliminar "${module.name}"? Solo es posible si ninguna transformación del catálogo la usa.`,
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(module.id)),
      )
      .subscribe(() => {
        this.modules.update((list) => list.filter((m) => m.id !== module.id));
        this.notifications.success('Plantilla eliminada.');
      });
  }

  private afterSave(module: AcceleoModule, message: string): void {
    this.notifications.success(message);
    this.dialogs.showWarnings(
      'Compilada con advertencias',
      `La plantilla "${module.name}" se guardó, pero el compilador reportó advertencias:`,
      module.warnings,
    );
    this.load();
  }
}

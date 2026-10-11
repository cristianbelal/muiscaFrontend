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
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, switchMap } from 'rxjs';
import { AtlModuleApi } from '../../../core/api/atl-module-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AtlModule } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';
import {
  SourceUpdateDialogComponent,
  SourceUpdateDialogData,
} from '../../../shared/dialogs/source-update-dialog.component';
import { FILE_TYPES } from '../../../shared/forms/file-validators';
import { AtlModuleFormDialogComponent } from '../atl-module-form-dialog/atl-module-form-dialog.component';

/** Gestión de módulos ATL modelo-a-modelo (/api/atl-modules). */
@Component({
  selector: 'app-atl-module-list',
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './atl-module-list.component.html',
})
export class AtlModuleListComponent implements OnInit {
  private readonly api = inject(AtlModuleApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly columns = ['name', 'mapping', 'compiler', 'createdBy', 'updatedAt', 'actions'];
  readonly modules = signal<AtlModule[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.modules().filter(
      (m) =>
        !term ||
        [m.name, m.moduleName, m.description ?? '', m.sourceMetamodel.name, m.targetMetamodel.name].some((value) =>
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

  canModify(module: AtlModule): boolean {
    return this.auth.canModify(module.createdBy);
  }

  create(): void {
    this.dialogs
      .openForm<AtlModuleFormDialogComponent, void, AtlModule>(AtlModuleFormDialogComponent, undefined, '720px')
      .pipe(filter((module): module is AtlModule => !!module))
      .subscribe((module) => this.afterSave(module, `Módulo ATL "${module.name}" registrado.`));
  }

  updateSource(module: AtlModule): void {
    this.dialogs
      .openForm<SourceUpdateDialogComponent<AtlModule>, SourceUpdateDialogData<AtlModule>, AtlModule>(
        SourceUpdateDialogComponent,
        {
          title: `Actualizar código de ${module.name}`,
          description:
            'Suba la nueva versión del archivo .atl. Se recompila en el servidor y, si compila, reemplaza a la actual en todas las transformaciones que la usan.',
          label: 'Nuevo código (.atl)',
          extensions: FILE_TYPES.atl,
          upload: (file) => this.api.updateSource(module.id, file),
        },
      )
      .pipe(filter((updated): updated is AtlModule => !!updated))
      .subscribe((updated) => this.afterSave(updated, `Código de "${updated.name}" actualizado.`));
  }

  editMetadata(module: AtlModule): void {
    this.dialogs
      .editMetadata({
        title: `Editar ${module.name}`,
        name: module.name,
        description: module.description,
        save: (request) => this.api.updateMetadata(module.id, request),
      })
      .subscribe((updated) => {
        this.modules.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
        this.notifications.success('Módulo ATL actualizado.');
      });
  }

  download(module: AtlModule): void {
    this.api.downloadSource(module).subscribe();
  }

  delete(module: AtlModule): void {
    this.dialogs
      .confirm({
        title: 'Eliminar módulo ATL',
        message: `¿Eliminar "${module.name}"? Solo es posible si ninguna transformación del catálogo lo usa.`,
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(module.id)),
      )
      .subscribe(() => {
        this.modules.update((list) => list.filter((m) => m.id !== module.id));
        this.notifications.success('Módulo ATL eliminado.');
      });
  }

  private afterSave(module: AtlModule, message: string): void {
    this.notifications.success(message);
    this.dialogs.showWarnings(
      'Compilado con advertencias',
      `El módulo "${module.name}" se guardó, pero el compilador reportó advertencias:`,
      module.warnings,
    );
    this.load();
  }
}

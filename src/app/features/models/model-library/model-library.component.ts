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
import { RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';
import { StoredModelApi } from '../../../core/api/stored-model-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { StoredModel } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { ModelUploadDialogComponent } from '../model-upload-dialog/model-upload-dialog.component';

/** Biblioteca de modelos del usuario (/api/models). El administrador ve los de todos. */
@Component({
  selector: 'app-model-library',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
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
    FileSizePipe,
  ],
  templateUrl: './model-library.component.html',
})
export class ModelLibraryComponent implements OnInit {
  private readonly api = inject(StoredModelApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  readonly isAdmin = inject(AuthService).isAdmin;

  readonly models = signal<StoredModel[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly columns = computed(() =>
    this.isAdmin()
      ? ['name', 'metamodel', 'file', 'owner', 'updatedAt', 'actions']
      : ['name', 'metamodel', 'file', 'updatedAt', 'actions'],
  );
  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.models().filter(
      (m) =>
        !term ||
        [m.name, m.description ?? '', m.metamodel.name, m.fileName, m.owner].some((v) =>
          v.toLowerCase().includes(term),
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
      .subscribe((models) => this.models.set(models));
  }

  upload(): void {
    this.dialogs
      .openForm<ModelUploadDialogComponent, void, StoredModel>(ModelUploadDialogComponent, undefined, '560px')
      .pipe(filter((model): model is StoredModel => !!model))
      .subscribe((model) => {
        this.notifications.success(`Modelo "${model.name}" guardado (${model.metamodel.name}).`);
        this.load();
      });
  }

  edit(model: StoredModel): void {
    this.dialogs
      .editMetadata({
        title: `Editar ${model.name}`,
        name: model.name,
        description: model.description,
        save: (request) => this.api.updateMetadata(model.id, request),
      })
      .subscribe((updated) => {
        this.models.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
        this.notifications.success('Modelo actualizado.');
      });
  }

  download(model: StoredModel): void {
    this.api.download(model).subscribe();
  }

  delete(model: StoredModel): void {
    this.dialogs
      .confirm({
        title: 'Eliminar modelo',
        message: `¿Eliminar "${model.name}" de la biblioteca? Las ejecuciones que ya hizo con él se conservan.`,
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(model.id)),
      )
      .subscribe(() => {
        this.models.update((list) => list.filter((m) => m.id !== model.id));
        this.notifications.success('Modelo eliminado.');
      });
  }
}

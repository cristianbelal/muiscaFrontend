import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';
import { TransformationApi } from '../../../core/api/transformation-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { Transformation } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TransformationChainComponent } from '../../../shared/components/transformation-chain/transformation-chain.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';
import {
  TransformationFormDialogComponent,
  TransformationFormDialogData,
} from '../transformation-form-dialog/transformation-form-dialog.component';

type PublicationFilter = 'all' | 'published' | 'draft';

/**
 * Gestión del catálogo (/api/transformations): MODEL_ENGINEER y ADMIN definen
 * transformaciones; solo ADMIN las publica o las retira (PATCH .../publication).
 */
@Component({
  selector: 'app-transformation-admin',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
    TransformationChainComponent,
  ],
  templateUrl: './transformation-admin.component.html',
})
export class TransformationAdminComponent implements OnInit {
  private readonly api = inject(TransformationApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  readonly isAdmin = this.auth.isAdmin;

  readonly columns = ['name', 'chain', 'published', 'createdBy', 'updatedAt', 'actions'];
  readonly transformations = signal<Transformation[]>([]);
  readonly loading = signal(true);
  readonly publishing = signal<number | null>(null);
  readonly search = signal('');
  readonly publication = signal<PublicationFilter>('all');

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const publication = this.publication();
    return this.transformations().filter(
      (t) =>
        (publication === 'all' || (publication === 'published') === t.published) &&
        (!term || [t.name, t.description ?? '', t.inputMetamodel.name].some((v) => v.toLowerCase().includes(term))),
    );
  });

  readonly draftCount = computed(() => this.transformations().filter((t) => !t.published).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((transformations) => this.transformations.set(transformations));
  }

  canModify(transformation: Transformation): boolean {
    return this.auth.canModify(transformation.createdBy);
  }

  create(): void {
    this.openForm({}, (t) => `Transformación "${t.name}" creada como borrador.`);
  }

  edit(transformation: Transformation): void {
    this.openForm({ transformation }, (t) => `Transformación "${t.name}" actualizada.`);
  }

  togglePublication(transformation: Transformation, event: MatSlideToggleChange): void {
    this.publishing.set(transformation.id);
    this.api
      .setPublication(transformation.id, event.checked)
      .pipe(finalize(() => this.publishing.set(null)))
      .subscribe({
        next: (updated) => {
          this.replace(updated);
          this.notifications.success(
            updated.published
              ? `"${updated.name}" ya está disponible para todos los usuarios.`
              : `"${updated.name}" se retiró del catálogo de usuarios.`,
          );
        },
        // Devuelve el interruptor a su estado real si el backend rechaza el cambio.
        error: () => (event.source.checked = transformation.published),
      });
  }

  delete(transformation: Transformation): void {
    this.dialogs
      .confirm({
        title: 'Eliminar transformación',
        message: `¿Eliminar "${transformation.name}"? Desaparecerá del catálogo; el historial de ejecuciones de los usuarios se conserva.`,
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(transformation.id)),
      )
      .subscribe(() => {
        this.transformations.update((list) => list.filter((t) => t.id !== transformation.id));
        this.notifications.success('Transformación eliminada.');
      });
  }

  private openForm(data: TransformationFormDialogData, message: (t: Transformation) => string): void {
    this.dialogs
      .openForm<TransformationFormDialogComponent, TransformationFormDialogData, Transformation>(
        TransformationFormDialogComponent,
        data,
        '720px',
      )
      .pipe(filter((t): t is Transformation => !!t))
      .subscribe((transformation) => {
        this.notifications.success(message(transformation));
        this.load();
      });
  }

  private replace(updated: Transformation): void {
    this.transformations.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
  }
}

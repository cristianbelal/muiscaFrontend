import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, map } from 'rxjs';
import { ArtifactProblem } from '../../core/models';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';
import { MetadataDialogComponent, MetadataDialogData } from './metadata-dialog.component';
import { ProblemsDialogComponent } from './problems-dialog.component';

/** Punto único para abrir diálogos con tamaños y comportamiento consistentes. */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data,
        width: '440px',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .pipe(map((result) => result === true));
  }

  /** Muestra advertencias de compilación; no hace nada si no hay ninguna. */
  showWarnings(title: string, message: string, problems: ArtifactProblem[] | null | undefined): void {
    if (!problems?.length) {
      return;
    }
    this.dialog.open(ProblemsDialogComponent, {
      data: { title, message, problems },
      width: '640px',
      maxWidth: 'calc(100vw - 32px)',
    });
  }

  /** Renombrar/describir un recurso; emite el recurso actualizado solo si se guardó. */
  editMetadata<T>(data: MetadataDialogData<T>): Observable<T> {
    return this.openForm<MetadataDialogComponent<T>, MetadataDialogData<T>, T>(
      MetadataDialogComponent,
      data,
      '520px',
    ).pipe(filter((result): result is T => result !== undefined && result !== null));
  }

  /** Abre un formulario en diálogo y emite su resultado solo si se guardó algo. */
  openForm<C, D, R>(component: ComponentType<C>, data: D, width = '640px'): Observable<R | undefined> {
    return this.dialog
      .open<C, D, R>(component, {
        data,
        width,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 32px)',
        disableClose: true,
        autoFocus: 'first-tabbable',
      })
      .afterClosed();
  }
}

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Acción irreversible (eliminar): el botón se pinta en rojo. */
  destructive?: boolean;
}

/** Reemplaza window.confirm() por un diálogo accesible y consistente con Material. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="title">
      @if (data.destructive) {
        <mat-icon aria-hidden="true" class="warn">warning</mat-icon>
      }
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p class="message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText ?? 'Cancelar' }}</button>
      <button
        mat-flat-button
        [class.destructive]="data.destructive"
        [mat-dialog-close]="true"
        cdkFocusInitial
      >
        {{ data.confirmText ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .warn {
      color: var(--mat-sys-error);
    }
    .message {
      margin: 0;
      white-space: pre-line;
    }
    .destructive {
      --mdc-filled-button-container-color: var(--mat-sys-error);
      --mdc-filled-button-label-text-color: var(--mat-sys-on-error);
    }
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

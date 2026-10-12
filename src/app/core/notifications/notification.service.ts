import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Avisos breves y consistentes en toda la aplicación (Material Snackbar). */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: 'snackbar-success' });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }

  error(message: string): void {
    // Los errores se quedan más tiempo y el lector de pantalla los anuncia con prioridad.
    this.snackBar.open(message, 'Cerrar', {
      duration: 8000,
      panelClass: 'snackbar-error',
      politeness: 'assertive',
    });
  }
}

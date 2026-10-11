import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';
import { AccountApi } from '../../core/api/account-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError, asApiError } from '../../core/http/api-error';
import { NotificationService } from '../../core/notifications/notification.service';
import { ApiErrorPanelComponent } from '../../shared/components/api-error-panel/api-error-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DialogService } from '../../shared/dialogs/dialog.service';
import { ROLE_DESCRIPTIONS } from '../../shared/labels/role-labels';
import { RoleLabelPipe } from '../../shared/pipes/role-label.pipe';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
}

/** Datos de la cuenta y autogestión (/api/account): cambiar la contraseña y eliminar la cuenta. */
@Component({
  selector: 'app-account',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    ApiErrorPanelComponent,
    RoleLabelPipe,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly accountApi = inject(AccountApi);
  private readonly notifications = inject(NotificationService);
  private readonly dialogs = inject(DialogService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;
  /** Las cuentas de Google aún no tienen contraseña: definen una sin indicar la actual. */
  readonly hasPassword = computed(() => this.user()?.localAccount ?? false);
  readonly roleDescription = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_DESCRIPTIONS[role] : '';
  });

  readonly refreshing = signal(false);
  readonly hidePasswords = signal(true);

  readonly passwordForm = this.fb.group(
    {
      currentPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );
  readonly savingPassword = signal(false);
  readonly passwordError = signal<ApiError | null>(null);

  readonly deletePassword = this.fb.control('');
  readonly deleting = signal(false);
  readonly deleteError = signal<ApiError | null>(null);

  /** Útil si un administrador acaba de cambiar el rol: el backend lo aplica de inmediato. */
  refresh(): void {
    this.refreshing.set(true);
    this.auth
      .refreshProfile()
      .pipe(finalize(() => this.refreshing.set(false)))
      .subscribe({
        next: () => this.notifications.success('Permisos actualizados.'),
        error: (error: unknown) => this.notifications.error(asApiError(error).message),
      });
  }

  changePassword(): void {
    const form = this.passwordForm;
    if (this.hasPassword() && !form.controls.currentPassword.value) {
      form.controls.currentPassword.setErrors({ required: true });
    }
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = form.getRawValue();
    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.accountApi
      .changePassword(this.hasPassword() ? currentPassword : null, newPassword)
      .pipe(
        switchMap(() => this.auth.refreshProfile()),
        finalize(() => this.savingPassword.set(false)),
      )
      .subscribe({
        next: () => {
          form.reset();
          this.notifications.success('Contraseña actualizada.');
        },
        error: (error: unknown) => this.passwordError.set(asApiError(error)),
      });
  }

  deleteAccount(): void {
    if (this.hasPassword() && !this.deletePassword.value) {
      this.deletePassword.setErrors({ required: true });
      this.deletePassword.markAsTouched();
      return;
    }
    this.dialogs
      .confirm({
        title: 'Eliminar mi cuenta',
        message:
          'Se eliminarán su cuenta, su historial de ejecuciones y su biblioteca de modelos. Esta acción no se puede deshacer.',
        confirmText: 'Eliminar definitivamente',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.deleting.set(true);
          this.deleteError.set(null);
          return this.accountApi
            .deleteAccount(this.hasPassword() ? this.deletePassword.value : null)
            .pipe(finalize(() => this.deleting.set(false)));
        }),
      )
      .subscribe({
        next: () => {
          this.notifications.info('Su cuenta fue eliminada.');
          this.auth.logout();
        },
        error: (error: unknown) => this.deleteError.set(asApiError(error)),
      });
  }

  logout(): void {
    this.auth.logout();
  }
}

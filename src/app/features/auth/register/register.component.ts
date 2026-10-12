import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SettingsApi } from '../../../core/api/settings-api.service';
import { AuthService, HOME_URL } from '../../../core/auth/auth.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';

/** Las reglas replican dto/RegisterRequest.java: usuario ≤ 100, contraseña entre 6 y 100. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
}

/** Auto-registro (POST /auth/register). El backend siempre crea cuentas con rol USER. */
@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AuthLayoutComponent,
    ApiErrorPanelComponent,
  ],
  templateUrl: './register.component.html',
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    mat-progress-bar {
      margin-bottom: 16px;
    }
    .submit {
      height: 48px;
      margin-top: 8px;
    }
    .center {
      text-align: center;
      margin: 24px 0 0;
    }
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly form = inject(NonNullableFormBuilder).group(
    {
      username: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );
  readonly loading = signal(false);
  readonly hidePassword = signal(true);
  readonly error = signal<ApiError | null>(null);
  readonly publicSettings = toSignal(inject(SettingsApi).publicSettings());

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .register(username.trim(), password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.notifications.success(`Bienvenido a MUISCA, ${user.username}.`);
          this.router.navigateByUrl(HOME_URL);
        },
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }
}

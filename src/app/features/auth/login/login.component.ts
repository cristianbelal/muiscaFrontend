import { AfterViewInit, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { SettingsApi } from '../../../core/api/settings-api.service';
import { AuthService, safeReturnUrl } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { asApiError } from '../../../core/http/api-error';
import { User } from '../../../core/models';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';

const SLOW_SERVER_MS = 5000;

/** Inicio de sesión con usuario/contraseña (POST /auth/login) o con Google (POST /oauth/google). */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AuthLayoutComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly google = inject(GoogleIdentityService);

  /** Ruta a la que volver tras iniciar sesión (la pone authGuard). */
  readonly returnUrl = input<string>();

  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required]],
  });
  readonly loading = signal(false);
  readonly hidePassword = signal(true);
  readonly errorMessage = signal('');
  readonly googleUnavailable = signal(false);
  /** El backend del plan gratuito puede tardar en despertar: se avisa si la respuesta demora. */
  readonly slowServer = signal(false);
  /** Aviso del administrador y si se permite crear cuentas (GET /api/settings/public). */
  readonly publicSettings = toSignal(inject(SettingsApi).publicSettings());

  ngAfterViewInit(): void {
    this.google
      .renderButton(this.googleButton().nativeElement, (credential) => this.onGoogleCredential(credential))
      .then((rendered) => this.googleUnavailable.set(!rendered));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.authenticate(this.auth.login(username.trim(), password));
  }

  private onGoogleCredential(credential: string | null): void {
    if (!credential) {
      this.errorMessage.set('Google no devolvió una credencial. Intente de nuevo.');
      return;
    }
    this.authenticate(this.auth.loginWithGoogle(credential));
  }

  private authenticate(request: Observable<User>): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const slowTimer = setTimeout(() => this.slowServer.set(true), SLOW_SERVER_MS);
    request
      .pipe(
        finalize(() => {
          clearTimeout(slowTimer);
          this.loading.set(false);
          this.slowServer.set(false);
        }),
      )
      .subscribe({
      next: () => this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: (error: unknown) => this.errorMessage.set(asApiError(error).message),
    });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { asApiError } from '../../core/http/api-error';
import { NotificationService } from '../../core/notifications/notification.service';
import { ROLE_DESCRIPTIONS } from '../../shared/labels/role-labels';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RoleLabelPipe } from '../../shared/pipes/role-label.pipe';

/**
 * Datos de la cuenta (GET /auth/validate). El backend no expone autogestión de la cuenta
 * (solo /api/users para ADMIN), por eso los cambios se solicitan a un administrador.
 */
@Component({
  selector: 'app-account',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, PageHeaderComponent, RoleLabelPipe],
  template: `
    <div class="page page-narrow">
      <app-page-header heading="Mi cuenta" icon="person" subtitle="Información de su sesión y de los permisos de su rol." />

      @if (user(); as current) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <dl class="details">
              <div>
                <dt>Usuario</dt>
                <dd>{{ current.username }}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd><span class="badge badge-primary">{{ current.role | roleLabel }}</span></dd>
              </div>
              <div>
                <dt>Tipo de cuenta</dt>
                <dd>{{ current.localAccount ? 'Usuario y contraseña' : 'Google' }}</dd>
              </div>
              <div class="full">
                <dt>Qué puede hacer</dt>
                <dd>{{ roleDescription() }}</dd>
              </div>
            </dl>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button type="button" (click)="refresh()" [disabled]="refreshing()">
              <mat-icon>refresh</mat-icon>
              Actualizar permisos
            </button>
            <button mat-flat-button type="button" (click)="logout()">
              <mat-icon>logout</mat-icon>
              Cerrar sesión
            </button>
          </mat-card-actions>
        </mat-card>

        <div class="callout info note" role="note">
          <mat-icon aria-hidden="true">info</mat-icon>
          @if (isAdmin()) {
            <p>
              Para cambiar nombres de usuario, contraseñas o roles use
              <a routerLink="/usuarios">Usuarios y roles</a>.
            </p>
          } @else {
            <p>
              Para cambiar su nombre de usuario, su contraseña o su rol, comuníquese con un administrador de MUISCA.
            </p>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .details {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px 24px;
      margin: 0;
    }
    .details .full {
      grid-column: 1 / -1;
    }
    dt {
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    dd {
      margin: 4px 0 0;
      word-break: break-word;
    }
    .note {
      margin-top: 16px;
    }
    .note a {
      color: inherit;
      font-weight: 500;
    }
  `,
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;
  readonly refreshing = signal(false);
  readonly roleDescription = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_DESCRIPTIONS[role] : '';
  });

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

  logout(): void {
    this.auth.logout();
  }
}

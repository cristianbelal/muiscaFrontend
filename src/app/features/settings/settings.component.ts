import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { SettingsApi } from '../../core/api/settings-api.service';
import { ApiError, asApiError } from '../../core/http/api-error';
import { NotificationService } from '../../core/notifications/notification.service';
import { SystemSettings } from '../../core/models';
import { ApiErrorPanelComponent } from '../../shared/components/api-error-panel/api-error-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DESCRIPTION_MAX_LENGTH, optionalText } from '../../shared/forms/form-utils';

/** Configuración del sistema (/api/settings, solo ADMIN). */
@Component({
  selector: 'app-settings',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    PageHeaderComponent,
    ApiErrorPanelComponent,
  ],
  template: `
    <div class="page page-narrow">
      <app-page-header
        heading="Configuración del sistema"
        icon="tune"
        subtitle="Parámetros globales de MUISCA. Los cambios se aplican de inmediato para todos los usuarios."
      />
      <mat-card appearance="outlined">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" aria-label="Cargando la configuración" />
        }
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="stack">
            <section>
              <mat-slide-toggle formControlName="registrationEnabled">Permitir el registro de cuentas nuevas</mat-slide-toggle>
              <p class="muted small hint">
                Si lo desactiva, nadie podrá crear una cuenta desde la pantalla de acceso ni entrar por primera vez con
                Google. Usted podrá seguir creando cuentas desde Usuarios y roles.
              </p>
            </section>
            <mat-form-field class="full-width">
              <mat-label>Aviso para los usuarios</mat-label>
              <textarea matInput formControlName="announcement" rows="3" [maxlength]="announcementMax"></textarea>
              <mat-hint>Se muestra en la pantalla de acceso y en el inicio. Déjelo vacío para no mostrar nada.</mat-hint>
              <mat-hint align="end">{{ form.controls.announcement.value.length }} / {{ announcementMax }}</mat-hint>
            </mat-form-field>
            <app-api-error-panel [error]="error()" />
            <div class="form-actions">
              @if (settings(); as current) {
                @if (current.updatedAt) {
                  <span class="muted small last-update">
                    Última modificación: {{ current.updatedAt | date: 'medium' }} por {{ current.updatedBy }}
                  </span>
                }
              }
              <button mat-flat-button type="submit" [disabled]="saving() || loading()">Guardar cambios</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .hint {
      margin: 6px 0 0 52px;
    }
    .last-update {
      margin-right: auto;
      align-self: center;
    }
  `,
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(SettingsApi);
  private readonly notifications = inject(NotificationService);

  readonly announcementMax = DESCRIPTION_MAX_LENGTH;
  readonly form = inject(NonNullableFormBuilder).group({
    registrationEnabled: [true],
    announcement: ['', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
  });
  readonly settings = signal<SystemSettings | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  ngOnInit(): void {
    this.api
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((settings) => this.apply(settings));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .update({ registrationEnabled: value.registrationEnabled, announcement: optionalText(value.announcement) })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (settings) => {
          this.apply(settings);
          this.notifications.success('Configuración guardada.');
        },
        error: (error: unknown) => this.error.set(asApiError(error)),
      });
  }

  private apply(settings: SystemSettings): void {
    this.settings.set(settings);
    this.form.reset({ registrationEnabled: settings.registrationEnabled, announcement: settings.announcement ?? '' });
  }
}

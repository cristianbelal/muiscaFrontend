import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable, finalize } from 'rxjs';
import { UserApi } from '../../../core/api/user-api.service';
import { ApiError, asApiError } from '../../../core/http/api-error';
import { ROLES, Role, UpdateUserRequest, User } from '../../../core/models';
import { ApiErrorPanelComponent } from '../../../shared/components/api-error-panel/api-error-panel.component';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../../shared/labels/role-labels';

export interface UserFormDialogData {
  /** Usuario a editar; si no viene, se crea uno nuevo. */
  user?: User;
  /** Id del administrador que edita, para impedir que se quite su propio rol. */
  currentUserId: number;
}

/**
 * Alta (POST /api/users) y edición (PUT /api/users/{id}) de usuarios. Las reglas replican
 * CreateUserRequest y UpdateUserRequest: usuario ≤ 100 y contraseña entre 6 y 100.
 */
@Component({
  selector: 'app-user-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    ApiErrorPanelComponent,
  ],
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  private readonly api = inject(UserApi);
  private readonly dialogRef = inject<MatDialogRef<UserFormDialogComponent, User>>(MatDialogRef);
  readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);

  readonly roles = ROLES;
  readonly roleLabels = ROLE_LABELS;
  readonly roleDescriptions = ROLE_DESCRIPTIONS;
  readonly isEdit = !!this.data.user;
  readonly isSelf = this.data.user?.id === this.data.currentUserId;

  readonly form = inject(NonNullableFormBuilder).group({
    username: [this.data.user?.username ?? '', [Validators.required, Validators.maxLength(100)]],
    // Al editar, la contraseña es opcional: vacía significa "no cambiarla".
    password: [
      '',
      this.isEdit
        ? [Validators.minLength(6), Validators.maxLength(100)]
        : [Validators.required, Validators.minLength(6), Validators.maxLength(100)],
    ],
    role: [{ value: this.data.user?.role ?? ('USER' as Role), disabled: this.isSelf }, Validators.required],
  });
  readonly hidePassword = signal(true);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const username = value.username.trim();
    const existing = this.data.user;
    let request: Observable<User>;
    if (existing) {
      const changes: UpdateUserRequest = {};
      if (username !== existing.username) {
        changes.username = username;
      }
      if (value.password) {
        changes.password = value.password;
      }
      if (value.role !== existing.role) {
        changes.role = value.role;
      }
      if (Object.keys(changes).length === 0) {
        this.dialogRef.close();
        return;
      }
      request = this.api.update(existing.id, changes);
    } else {
      request = this.api.create({ username, password: value.password, role: value.role });
    }

    this.saving.set(true);
    this.error.set(null);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (user) => this.dialogRef.close(user),
      error: (error: unknown) => this.error.set(asApiError(error)),
    });
  }
}

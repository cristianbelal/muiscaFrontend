import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, switchMap } from 'rxjs';
import { UserApi } from '../../../core/api/user-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ROLES, Role, User } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DialogService } from '../../../shared/dialogs/dialog.service';
import { ROLE_LABELS } from '../../../shared/labels/role-labels';
import { RoleLabelPipe } from '../../../shared/pipes/role-label.pipe';
import { UserFormDialogComponent, UserFormDialogData } from '../user-form-dialog/user-form-dialog.component';

/** Gestión de usuarios y roles (/api/users, solo ADMIN). */
@Component({
  selector: 'app-user-list',
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
    RoleLabelPipe,
  ],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private readonly api = inject(UserApi);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly roles = ROLES;
  readonly roleLabels = ROLE_LABELS;
  readonly columns = ['username', 'role', 'account', 'actions'];
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly roleFilter = signal<Role | 'ALL'>('ALL');
  readonly currentUserId = computed(() => this.auth.user()?.id ?? -1);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const role = this.roleFilter();
    return this.users().filter(
      (u) => (role === 'ALL' || u.role === role) && (!term || u.username.toLowerCase().includes(term)),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((users) => this.users.set(users));
  }

  isSelf(user: User): boolean {
    return user.id === this.currentUserId();
  }

  create(): void {
    this.openForm({ currentUserId: this.currentUserId() }, (u) => `Usuario "${u.username}" creado.`);
  }

  edit(user: User): void {
    this.openForm({ user, currentUserId: this.currentUserId() }, (u) => `Usuario "${u.username}" actualizado.`);
  }

  delete(user: User): void {
    this.dialogs
      .confirm({
        title: 'Eliminar usuario',
        message:
          `¿Eliminar la cuenta "${user.username}"?\n\n` +
          'Si el usuario registró metamodelos, módulos, transformaciones o ejecuciones, el sistema no permitirá ' +
          'eliminarlo; en ese caso cámbiele el rol.',
        confirmText: 'Eliminar',
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(user.id)),
      )
      .subscribe(() => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.notifications.success('Usuario eliminado.');
      });
  }

  private openForm(data: UserFormDialogData, message: (user: User) => string): void {
    this.dialogs
      .openForm<UserFormDialogComponent, UserFormDialogData, User>(UserFormDialogComponent, data, '520px')
      .pipe(filter((user): user is User => !!user))
      .subscribe((user) => {
        this.notifications.success(message(user));
        this.load();
      });
  }
}

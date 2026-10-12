import { Pipe, PipeTransform } from '@angular/core';
import { Role } from '../../core/models';
import { ROLE_LABELS } from '../labels/role-labels';

/** ADMIN → "Administrador", MODEL_ENGINEER → "Ingeniero de modelos", USER → "Usuario". */
@Pipe({ name: 'roleLabel' })
export class RoleLabelPipe implements PipeTransform {
  transform(role: Role | null | undefined): string {
    return role ? ROLE_LABELS[role] : '';
  }
}

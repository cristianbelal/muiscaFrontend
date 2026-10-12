import { Role } from '../../core/models';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  MODEL_ENGINEER: 'Ingeniero de modelos',
  USER: 'Usuario',
};

/** Permisos de cada rol, tal como los define SecurityConfig en el backend. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Acceso total: gestiona usuarios y roles, publica transformaciones y administra todo el catálogo.',
  MODEL_ENGINEER:
    'Registra metamodelos, módulos ATL y plantillas Acceleo, define transformaciones y usa el espacio de trabajo.',
  USER: 'Ejecuta las transformaciones publicadas sobre sus modelos y consulta sus resultados.',
};

import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';
import { CATALOG_MANAGER_ROLES, Role } from './core/models';

const ADMIN_ONLY: Role[] = ['ADMIN'];

/**
 * Todas las pantallas se cargan bajo demanda (lazy loading). Los roles replican las reglas de
 * SecurityConfig del backend para no mostrar secciones que responderían 403.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    title: 'Crear cuenta',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },

  // Rutas del prototipo anterior: se conservan como redirecciones para no romper enlaces guardados.
  { path: 'atlUserView', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'atlAdminView', redirectTo: 'espacio-trabajo', pathMatch: 'full' },
  { path: 'list', redirectTo: 'catalogo', pathMatch: 'full' },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'catalogo',
        loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
      },
      {
        path: 'ejecuciones',
        loadChildren: () => import('./features/executions/executions.routes').then((m) => m.EXECUTION_ROUTES),
      },
      {
        path: 'modelos',
        title: 'Mis modelos',
        loadComponent: () =>
          import('./features/models/model-library/model-library.component').then((m) => m.ModelLibraryComponent),
      },
      {
        path: 'cuenta',
        title: 'Mi cuenta',
        loadComponent: () => import('./features/account/account.component').then((m) => m.AccountComponent),
      },
      {
        path: 'metamodelos',
        title: 'Metamodelos',
        canActivate: [roleGuard],
        data: { roles: CATALOG_MANAGER_ROLES },
        loadComponent: () =>
          import('./features/metamodels/metamodel-list/metamodel-list.component').then((m) => m.MetamodelListComponent),
      },
      {
        path: 'modulos-atl',
        title: 'Módulos ATL',
        canActivate: [roleGuard],
        data: { roles: CATALOG_MANAGER_ROLES },
        loadComponent: () =>
          import('./features/atl-modules/atl-module-list/atl-module-list.component').then(
            (m) => m.AtlModuleListComponent,
          ),
      },
      {
        path: 'plantillas-acceleo',
        title: 'Plantillas Acceleo',
        canActivate: [roleGuard],
        data: { roles: CATALOG_MANAGER_ROLES },
        loadComponent: () =>
          import('./features/acceleo-modules/acceleo-module-list/acceleo-module-list.component').then(
            (m) => m.AcceleoModuleListComponent,
          ),
      },
      {
        path: 'transformaciones',
        title: 'Gestión de transformaciones',
        canActivate: [roleGuard],
        data: { roles: CATALOG_MANAGER_ROLES },
        loadComponent: () =>
          import('./features/transformations/transformation-admin/transformation-admin.component').then(
            (m) => m.TransformationAdminComponent,
          ),
      },
      {
        path: 'espacio-trabajo',
        title: 'Espacio de trabajo',
        canActivate: [roleGuard],
        data: { roles: CATALOG_MANAGER_ROLES },
        loadComponent: () => import('./features/workspace/workspace.component').then((m) => m.WorkspaceComponent),
      },
      {
        path: 'usuarios',
        title: 'Usuarios y roles',
        canActivate: [roleGuard],
        data: { roles: ADMIN_ONLY },
        loadComponent: () => import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'configuracion',
        title: 'Configuración del sistema',
        canActivate: [roleGuard],
        data: { roles: ADMIN_ONLY },
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];

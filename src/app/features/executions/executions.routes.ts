import { Routes } from '@angular/router';

export const EXECUTION_ROUTES: Routes = [
  {
    path: '',
    title: 'Historial de ejecuciones',
    loadComponent: () => import('./execution-list/execution-list.component').then((m) => m.ExecutionListComponent),
  },
  {
    path: ':id',
    title: 'Detalle de la ejecución',
    loadComponent: () => import('./execution-detail/execution-detail.component').then((m) => m.ExecutionDetailComponent),
  },
];

import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    title: 'Catálogo de transformaciones',
    loadComponent: () =>
      import('./transformation-catalog/transformation-catalog.component').then((m) => m.TransformationCatalogComponent),
  },
  {
    path: ':id/ejecutar',
    title: 'Ejecutar transformación',
    loadComponent: () =>
      import('./execute-transformation/execute-transformation.component').then((m) => m.ExecuteTransformationComponent),
  },
];

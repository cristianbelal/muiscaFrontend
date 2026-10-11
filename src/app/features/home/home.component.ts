import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';
import { AcceleoModuleApi } from '../../core/api/acceleo-module-api.service';
import { AtlModuleApi } from '../../core/api/atl-module-api.service';
import { ExecutionApi } from '../../core/api/execution-api.service';
import { MetamodelApi } from '../../core/api/metamodel-api.service';
import { SettingsApi } from '../../core/api/settings-api.service';
import { TransformationApi } from '../../core/api/transformation-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ExecutionSummary } from '../../core/models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { RoleLabelPipe } from '../../shared/pipes/role-label.pipe';

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  link: string;
}

interface CatalogStat {
  label: string;
  value: number | null;
  link: string;
  icon: string;
}

const RECENT_LIMIT = 5;

/**
 * Inicio de todos los roles (antes "atl-client-view", la vista del usuario final). Explica
 * el proceso en lenguaje sencillo y lleva a las tareas más frecuentes de cada rol.
 */
@Component({
  selector: 'app-home',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    EmptyStateComponent,
    StatusBadgeComponent,
    DurationPipe,
    RoleLabelPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly executionApi = inject(ExecutionApi);
  private readonly transformationApi = inject(TransformationApi);
  private readonly metamodelApi = inject(MetamodelApi);
  private readonly atlApi = inject(AtlModuleApi);
  private readonly acceleoApi = inject(AcceleoModuleApi);

  readonly user = this.auth.user;
  readonly canManageCatalog = this.auth.canManageCatalog;
  readonly recent = signal<ExecutionSummary[]>([]);
  readonly loadingRecent = signal(true);
  readonly stats = signal<CatalogStat[]>([]);
  readonly publicSettings = toSignal(inject(SettingsApi).publicSettings());

  readonly actions = computed<QuickAction[]>(() => {
    const actions: QuickAction[] = [
      {
        icon: 'play_circle',
        title: 'Ejecutar una transformación',
        description: 'Elija una opción del catálogo y suba su modelo.',
        link: '/catalogo',
      },
      {
        icon: 'history',
        title: this.auth.isAdmin() ? 'Historial de ejecuciones' : 'Mis resultados',
        description: 'Descargue modelos transformados y contratos generados.',
        link: '/ejecuciones',
      },
    ];
    if (this.canManageCatalog()) {
      actions.push(
        {
          icon: 'science',
          title: 'Espacio de trabajo',
          description: 'Compile y pruebe módulos ATL y plantillas Acceleo.',
          link: '/espacio-trabajo',
        },
        {
          icon: 'account_tree',
          title: 'Definir transformaciones',
          description: 'Encadene módulos y publíquelos en el catálogo.',
          link: '/transformaciones',
        },
      );
    }
    if (this.auth.isAdmin()) {
      actions.push({
        icon: 'manage_accounts',
        title: 'Usuarios y roles',
        description: 'Cree cuentas y asigne permisos.',
        link: '/usuarios',
      });
    }
    return actions;
  });

  ngOnInit(): void {
    this.executionApi
      .list()
      .pipe(finalize(() => this.loadingRecent.set(false)))
      .subscribe((executions) => this.recent.set(executions.slice(0, RECENT_LIMIT)));

    if (this.canManageCatalog()) {
      this.loadStats();
    }
  }

  private loadStats(): void {
    // Un contador que falle no debe impedir mostrar los demás.
    const count = <T>(source: Observable<T[]>): Observable<number | null> =>
      source.pipe(
        map((items) => items.length),
        catchError(() => of(null)),
      );
    forkJoin({
      metamodels: count(this.metamodelApi.list()),
      atl: count(this.atlApi.list()),
      acceleo: count(this.acceleoApi.list()),
      transformations: count(this.transformationApi.list()),
    }).subscribe((counts) =>
      this.stats.set([
        { label: 'Metamodelos', value: counts.metamodels, link: '/metamodelos', icon: 'schema' },
        { label: 'Módulos ATL', value: counts.atl, link: '/modulos-atl', icon: 'transform' },
        {
          label: 'Plantillas Acceleo',
          value: counts.acceleo,
          link: '/plantillas-acceleo',
          icon: 'integration_instructions',
        },
        { label: 'Transformaciones', value: counts.transformations, link: '/transformaciones', icon: 'account_tree' },
      ]),
    );
  }
}

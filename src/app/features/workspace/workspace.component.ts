import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AcceleoWorkspaceComponent } from './acceleo-workspace/acceleo-workspace.component';
import { AtlWorkspaceComponent } from './atl-workspace/atl-workspace.component';

/**
 * Espacio de trabajo del ingeniero de modelos (/api/workspace): compila y prueba módulos ATL
 * y plantillas Acceleo con sus propios archivos, sin registrar nada en el catálogo.
 */
@Component({
  selector: 'app-workspace',
  imports: [MatTabsModule, PageHeaderComponent, AtlWorkspaceComponent, AcceleoWorkspaceComponent],
  template: `
    <div class="page">
      <app-page-header
        heading="Espacio de trabajo"
        icon="science"
        subtitle="Pruebe sus artefactos como en una configuración de ejecución de Eclipse. Nada de lo que haga aquí se guarda en el catálogo."
      />
      <mat-tab-group mat-stretch-tabs="false" animationDuration="0ms">
        <mat-tab label="Transformación ATL (modelo a modelo)">
          <app-atl-workspace />
        </mat-tab>
        <mat-tab label="Plantilla Acceleo (modelo a código)">
          <app-acceleo-workspace />
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class WorkspaceComponent {}

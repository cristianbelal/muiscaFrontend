import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { CATALOG_MANAGER_ROLES, Role } from '../../core/models';
import { RoleLabelPipe } from '../../shared/pipes/role-label.pipe';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  description: string;
}

interface NavSection {
  title: string;
  roles?: readonly Role[];
  items: NavItem[];
}

/** Marco de la aplicación autenticada: barra superior, menú lateral por rol y contenido. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    RoleLabelPipe,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly sidenav = viewChild.required(MatSidenav);

  readonly user = this.auth.user;
  /** Distingue laboratorio y local de producción (producción no define nombre). */
  readonly environmentName = environment.environmentName;
  readonly isMobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  readonly sections = computed<NavSection[]>(() => {
    const historyLabel = this.auth.isAdmin() ? 'Historial de ejecuciones' : 'Mis resultados';
    const all: NavSection[] = [
      {
        title: 'Transformar',
        items: [
          { label: 'Inicio', icon: 'home', link: '/inicio', description: 'Resumen y accesos rápidos' },
          {
            label: 'Catálogo',
            icon: 'auto_awesome_motion',
            link: '/catalogo',
            description: 'Transformaciones disponibles para sus modelos',
          },
          {
            label: this.auth.isAdmin() ? 'Modelos guardados' : 'Mis modelos',
            icon: 'folder_open',
            link: '/modelos',
            description: 'Biblioteca de modelos para reutilizar',
          },
          { label: historyLabel, icon: 'history', link: '/ejecuciones', description: 'Modelos y contratos generados' },
        ],
      },
      {
        title: 'Modelado',
        roles: CATALOG_MANAGER_ROLES,
        items: [
          { label: 'Metamodelos', icon: 'schema', link: '/metamodelos', description: 'Metamodelos Ecore de cada plataforma' },
          { label: 'Módulos ATL', icon: 'transform', link: '/modulos-atl', description: 'Transformaciones modelo a modelo' },
          {
            label: 'Plantillas Acceleo',
            icon: 'integration_instructions',
            link: '/plantillas-acceleo',
            description: 'Generadores de código del contrato',
          },
          {
            label: 'Transformaciones',
            icon: 'account_tree',
            link: '/transformaciones',
            description: 'Definir y publicar opciones del catálogo',
          },
          {
            label: 'Espacio de trabajo',
            icon: 'science',
            link: '/espacio-trabajo',
            description: 'Compilar y probar sin registrar',
          },
        ],
      },
      {
        title: 'Administración',
        roles: ['ADMIN'],
        items: [
          { label: 'Usuarios y roles', icon: 'manage_accounts', link: '/usuarios', description: 'Cuentas y permisos' },
          { label: 'Configuración', icon: 'tune', link: '/configuracion', description: 'Registro y avisos del sistema' },
        ],
      },
    ];
    return all.filter((section) => this.auth.hasAnyRole(section.roles));
  });

  onNavigate(): void {
    if (this.isMobile()) {
      this.sidenav().close();
    }
  }

  focusMain(main: HTMLElement): void {
    main.focus();
  }

  logout(): void {
    this.auth.logout();
  }
}

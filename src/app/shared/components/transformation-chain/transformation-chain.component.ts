import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Reference } from '../../../core/models';

/** Lo mínimo para dibujar la cadena; lo cumple Transformation y la vista previa del formulario. */
export interface ChainParts {
  inputMetamodel: Reference | null;
  atlModule: Reference | null;
  outputMetamodel: Reference | null;
  acceleoModule: Reference | null;
}

/**
 * Explica visualmente qué hace una transformación: modelo de entrada → (ATL) → modelo de
 * salida → (Acceleo) → código del contrato. Pensado para usuarios sin experiencia en MDE.
 */
@Component({
  selector: 'app-transformation-chain',
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <ol class="chain" aria-label="Pasos de la transformación">
      <li class="node model" matTooltip="Modelo que usted sube">
        <mat-icon aria-hidden="true">account_tree</mat-icon>
        <span>Modelo {{ chain().inputMetamodel?.name ?? '¿?' }}</span>
      </li>
      @if (chain().atlModule; as atl) {
        <li class="step" [matTooltip]="'Transformación ATL: ' + atl.name">
          <mat-icon aria-hidden="true">arrow_forward</mat-icon>
          <span class="visually-hidden">se transforma con el módulo ATL {{ atl.name }} en</span>
        </li>
        <li class="node model" matTooltip="Modelo transformado (descargable)">
          <mat-icon aria-hidden="true">account_tree</mat-icon>
          <span>Modelo {{ chain().outputMetamodel?.name ?? '¿?' }}</span>
        </li>
      }
      @if (chain().acceleoModule; as acceleo) {
        <li class="step" [matTooltip]="'Plantilla Acceleo: ' + acceleo.name">
          <mat-icon aria-hidden="true">arrow_forward</mat-icon>
          <span class="visually-hidden">genera código con la plantilla {{ acceleo.name }}</span>
        </li>
        <li class="node code" matTooltip="Código fuente del contrato inteligente">
          <mat-icon aria-hidden="true">code</mat-icon>
          <span>Código del contrato</span>
        </li>
      }
    </ol>
    @if (showModules() && (chain().atlModule || chain().acceleoModule)) {
      <p class="modules">
        @if (chain().atlModule; as atl) {
          <span>ATL: {{ atl.name }}</span>
        }
        @if (chain().acceleoModule; as acceleo) {
          <span>Acceleo: {{ acceleo.name }}</span>
        }
      </p>
    }
  `,
  styles: `
    .chain {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .node {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 500;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .node.code {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    .node mat-icon,
    .step mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .step {
      display: inline-flex;
      color: var(--mat-sys-outline);
    }
    .modules {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
      margin: 6px 0 0;
      font-size: 0.78rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class TransformationChainComponent {
  readonly chain = input.required<ChainParts>();
  /** Muestra debajo los nombres de los módulos ATL/Acceleo (útil para ingenieros). */
  readonly showModules = input(false);
}

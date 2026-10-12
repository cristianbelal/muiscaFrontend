import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Encabezado uniforme de cada pantalla: icono, título, explicación y acciones a la derecha. */
@Component({
  selector: 'app-page-header',
  imports: [MatIconModule],
  template: `
    <header class="page-header">
      @if (icon()) {
        <mat-icon class="icon" aria-hidden="true">{{ icon() }}</mat-icon>
      }
      <div class="titles">
        <h1>{{ heading() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px 16px;
      margin-bottom: 24px;
    }
    .icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--mat-sys-primary);
    }
    .titles {
      flex: 1 1 280px;
      min-width: 0;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }
    .subtitle {
      margin: 4px 0 0;
      color: var(--mat-sys-on-surface-variant);
      max-width: 72ch;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
  readonly icon = input('');
}

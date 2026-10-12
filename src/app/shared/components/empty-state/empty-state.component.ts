import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Mensaje amable cuando una lista no tiene datos, con una acción sugerida opcional. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty" role="status">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <h2>{{ heading() }}</h2>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      padding: 40px 16px;
      color: var(--mat-sys-on-surface-variant);
    }
    mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.7;
    }
    h2 {
      margin: 0;
      font: var(--mat-sys-title-medium);
      color: var(--mat-sys-on-surface);
    }
    p {
      margin: 0 0 8px;
      max-width: 52ch;
    }
  `,
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly heading = input.required<string>();
  readonly message = input('');
}

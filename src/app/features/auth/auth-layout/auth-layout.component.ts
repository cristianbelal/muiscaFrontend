import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** Marco común de las pantallas de acceso (login y registro). */
@Component({
  selector: 'app-auth-layout',
  imports: [MatCardModule, MatIconModule],
  template: `
    <main class="auth-page">
      <section class="intro" aria-hidden="true">
        <mat-icon class="logo">hub</mat-icon>
        <p class="name">MUISCA</p>
        <p class="tagline">
          Convierta modelos en contratos inteligentes para Hyperledger Fabric y Ethereum, sin escribir código.
        </p>
        <ol class="steps">
          <li>Elija una transformación del catálogo.</li>
          <li>Suba su modelo (.xmi).</li>
          <li>Descargue el modelo transformado y el código del contrato.</li>
        </ol>
      </section>
      <mat-card class="card" appearance="outlined">
        <mat-card-content>
          <h1>{{ heading() }}</h1>
          @if (subtitle()) {
            <p class="subtitle">{{ subtitle() }}</p>
          }
          <ng-content />
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: `
    .auth-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr;
      align-items: center;
      justify-items: center;
      gap: 32px;
      padding: 32px 16px;
      box-sizing: border-box;
      background: linear-gradient(135deg, var(--mat-sys-primary-container), var(--mat-sys-surface-container-low) 60%);
    }
    @media (min-width: 960px) {
      .auth-page {
        grid-template-columns: minmax(280px, 440px) minmax(320px, 440px);
        justify-content: center;
        gap: 64px;
      }
    }
    .intro {
      max-width: 440px;
      color: var(--mat-sys-on-primary-container);
    }
    @media (max-width: 959.98px) {
      .intro .steps {
        display: none;
      }
    }
    .logo {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    .name {
      margin: 8px 0 0;
      font: var(--mat-sys-display-small);
      font-weight: 700;
      letter-spacing: 0.1em;
    }
    .tagline {
      margin: 8px 0 16px;
      font: var(--mat-sys-title-medium);
    }
    .steps {
      margin: 0;
      padding-left: 20px;
      line-height: 1.8;
    }
    .card {
      width: 100%;
      max-width: 440px;
      padding: 8px;
      box-sizing: border-box;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }
    .subtitle {
      margin: 4px 0 24px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class AuthLayoutComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
}

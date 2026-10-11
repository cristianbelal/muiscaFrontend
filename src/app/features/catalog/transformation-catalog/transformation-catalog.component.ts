import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TransformationApi } from '../../../core/api/transformation-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Transformation } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TransformationChainComponent } from '../../../shared/components/transformation-chain/transformation-chain.component';

type OutputFilter = 'all' | 'code' | 'model';

/**
 * Catálogo que ve el usuario final (GET /api/transformations). El rol USER solo recibe las
 * publicadas; ingenieros y administradores ven también los borradores para probarlos.
 */
@Component({
  selector: 'app-transformation-catalog',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
    TransformationChainComponent,
  ],
  templateUrl: './transformation-catalog.component.html',
  styleUrl: './transformation-catalog.component.css',
})
export class TransformationCatalogComponent implements OnInit {
  private readonly api = inject(TransformationApi);
  readonly canManageCatalog = inject(AuthService).canManageCatalog;

  /** ?metamodelo=... (desde "Transformar" en la biblioteca de modelos) prefiltra el catálogo. */
  readonly metamodelo = input<string>();

  readonly transformations = signal<Transformation[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly output = signal<OutputFilter>('all');
  /** Solo transformaciones que reciben modelos de este metamodelo. */
  readonly inputMetamodel = signal<string | null>(null);

  readonly filtered = computed(() => {
    const term = normalize(this.search());
    const output = this.output();
    const input = this.inputMetamodel();
    return this.transformations().filter((t) => {
      if (input && t.inputMetamodel.name !== input) {
        return false;
      }
      const matchesOutput =
        output === 'all' || (output === 'code' && t.producesCode) || (output === 'model' && t.producesModel);
      const haystack = normalize(
        [t.name, t.description, t.inputMetamodel?.name, t.outputMetamodel?.name].filter(Boolean).join(' '),
      );
      return matchesOutput && (!term || haystack.includes(term));
    });
  });

  ngOnInit(): void {
    this.inputMetamodel.set(this.metamodelo() ?? null);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((transformations) => this.transformations.set(transformations));
  }

  clearFilters(): void {
    this.search.set('');
    this.output.set('all');
    this.inputMetamodel.set(null);
  }
}

/** Búsqueda sin distinguir mayúsculas ni tildes. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

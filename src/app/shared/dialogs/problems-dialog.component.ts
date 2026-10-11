import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ArtifactProblem } from '../../core/models';
import { ProblemListComponent } from '../components/problem-list/problem-list.component';

export interface ProblemsDialogData {
  title: string;
  message: string;
  problems: ArtifactProblem[];
}

/** Muestra las advertencias que devuelve el backend al registrar un artefacto que sí compiló. */
@Component({
  selector: 'app-problems-dialog',
  imports: [MatDialogModule, MatButtonModule, ProblemListComponent],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <app-problem-list [problems]="data.problems" heading="Advertencias" />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button mat-dialog-close cdkFocusInitial>Entendido</button>
    </mat-dialog-actions>
  `,
})
export class ProblemsDialogComponent {
  readonly data = inject<ProblemsDialogData>(MAT_DIALOG_DATA);
}

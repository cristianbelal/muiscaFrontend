import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import { ExecutionApi } from '../../../core/api/execution-api.service';
import { Execution, ExecutionArtifact, GeneratedFile } from '../../../core/models';
import { DurationPipe } from '../../pipes/duration.pipe';
import { CodeViewerComponent } from '../code-viewer/code-viewer.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

type DownloadableArtifact = Exclude<ExecutionArtifact, 'generatedFiles'>;

/**
 * Resultado de una ejecución: estado, artefactos descargables (modelo de entrada, modelo
 * transformado, ZIP de código) y vista previa de los contratos inteligentes generados.
 */
@Component({
  selector: 'app-execution-result',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, StatusBadgeComponent, CodeViewerComponent, DurationPipe],
  templateUrl: './execution-result.component.html',
  styleUrl: './execution-result.component.css',
})
export class ExecutionResultComponent {
  private readonly api = inject(ExecutionApi);

  readonly execution = input.required<Execution>();

  readonly files = signal<GeneratedFile[]>([]);
  readonly loadingFiles = signal(false);
  readonly downloading = signal<DownloadableArtifact | null>(null);

  readonly succeeded = computed(() => this.execution().status === 'SUCCEEDED');
  readonly hasOutputModel = computed(() => !!this.execution().downloads.outputModel);
  readonly hasCode = computed(() => !!this.execution().downloads.generatedCode);

  constructor() {
    effect(() => {
      const execution = this.execution();
      this.files.set([]);
      if (execution.downloads.generatedFiles) {
        this.loadFiles(execution.id);
      }
    });
  }

  download(artifact: DownloadableArtifact): void {
    this.downloading.set(artifact);
    this.api
      .download(this.execution(), artifact)
      .pipe(finalize(() => this.downloading.set(null)))
      .subscribe();
  }

  private loadFiles(id: number): void {
    this.loadingFiles.set(true);
    this.api
      .generatedFiles(id)
      .pipe(finalize(() => this.loadingFiles.set(false)))
      .subscribe((files) => this.files.set(files));
  }
}

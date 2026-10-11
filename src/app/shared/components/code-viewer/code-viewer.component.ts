import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileDownloadService } from '../../../core/files/file-download.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { GeneratedFile } from '../../../core/models';

const LANGUAGES: Record<string, string> = {
  sol: 'Solidity',
  go: 'Go',
  java: 'Java',
  xmi: 'XMI',
  xml: 'XML',
  ecore: 'Ecore',
  atl: 'ATL',
  mtl: 'Acceleo',
  json: 'JSON',
  js: 'JavaScript',
  ts: 'TypeScript',
  txt: 'Texto',
};

/** Visor de archivos de texto/código con lista de archivos, copiar y descargar. */
@Component({
  selector: 'app-code-viewer',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './code-viewer.component.html',
  styleUrl: './code-viewer.component.css',
})
export class CodeViewerComponent {
  private readonly clipboard = inject(Clipboard);
  private readonly notifications = inject(NotificationService);
  private readonly downloads = inject(FileDownloadService);

  readonly files = input.required<GeneratedFile[]>();
  readonly selectedIndex = signal(0);
  readonly selected = computed<GeneratedFile | undefined>(() => this.files()[this.selectedIndex()]);
  readonly language = computed(() => languageOf(this.selected()?.path ?? ''));

  constructor() {
    // Si cambia la lista (otra ejecución), se vuelve al primer archivo.
    effect(() => {
      this.files();
      this.selectedIndex.set(0);
    });
  }

  fileName(path: string): string {
    return path.split('/').pop() ?? path;
  }

  copy(): void {
    const file = this.selected();
    if (file && this.clipboard.copy(file.content)) {
      this.notifications.success(`Se copió ${this.fileName(file.path)} al portapapeles.`);
    }
  }

  download(): void {
    const file = this.selected();
    if (file) {
      this.downloads.saveBlob(new Blob([file.content], { type: 'text/plain;charset=utf-8' }), this.fileName(file.path));
    }
  }
}

function languageOf(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return LANGUAGES[extension] ?? (extension ? extension.toUpperCase() : 'Texto');
}

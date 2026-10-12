import { Pipe, PipeTransform } from '@angular/core';

/** Bytes a texto legible: 2048 → "2 KB". */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) {
      return '';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value.toLocaleString('es-CO', { maximumFractionDigits: 1 })} ${units[unit]}`;
  }
}

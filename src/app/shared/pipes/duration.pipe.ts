import { Pipe, PipeTransform } from '@angular/core';

/** Milisegundos a texto legible: 850 → "850 ms", 1234 → "1,2 s", 65000 → "1 min 5 s". */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(ms: number | null | undefined): string {
    if (ms === null || ms === undefined || ms < 0) {
      return '—';
    }
    if (ms < 1000) {
      return `${ms} ms`;
    }
    if (ms < 60_000) {
      return `${(ms / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} s`;
    }
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.round((ms % 60_000) / 1000);
    return seconds ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }
}

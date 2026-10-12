import { Component, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileSizePipe } from '../../pipes/file-size.pipe';

let nextId = 0;

/**
 * Selector de archivos para Reactive Forms (ControlValueAccessor) con arrastrar y soltar.
 * Su valor es un File o null y muestra los errores de los validadores de file-validators.ts.
 */
@Component({
  selector: 'app-file-picker',
  imports: [MatButtonModule, MatIconModule, FileSizePipe],
  templateUrl: './file-picker.component.html',
  styleUrl: './file-picker.component.css',
})
export class FilePickerComponent implements ControlValueAccessor {
  /** Etiqueta visible, p. ej. "Metamodelo de entrada (.ecore)". */
  readonly label = input.required<string>();
  /** Extensiones aceptadas separadas por coma, p. ej. ".xmi,.xml". */
  readonly accept = input('');
  /** Texto de ayuda en lenguaje sencillo. */
  readonly hint = input('');

  readonly id = `file-picker-${nextId++}`;
  readonly file = signal<File | null>(null);
  readonly disabled = signal(false);
  readonly dragging = signal(false);

  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private onChange: (file: File | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get required(): boolean {
    return this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  }

  get showError(): boolean {
    const control = this.ngControl?.control;
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  get errorMessage(): string {
    const errors = this.ngControl?.control?.errors;
    if (!errors) {
      return '';
    }
    if (errors['required']) {
      return 'Seleccione un archivo.';
    }
    if (errors['fileExtension']) {
      return `El archivo debe tener extensión ${(errors['fileExtension'].allowed as string[]).join(' o ')}.`;
    }
    if (errors['fileEmpty']) {
      return 'El archivo está vacío.';
    }
    if (errors['fileSize']) {
      return 'El archivo supera el tamaño máximo permitido (10 MB).';
    }
    return 'El archivo no es válido.';
  }

  writeValue(value: File | null): void {
    this.file.set(value ?? null);
  }

  registerOnChange(fn: (file: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onSelect(input: HTMLInputElement): void {
    this.select(input.files?.item(0) ?? null);
    // Permite volver a elegir el mismo archivo después de corregirlo en disco.
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (!this.disabled()) {
      this.select(event.dataTransfer?.files.item(0) ?? null);
    }
  }

  clear(): void {
    this.select(null);
  }

  private select(file: File | null): void {
    this.file.set(file);
    this.onChange(file);
    this.onTouched();
  }
}

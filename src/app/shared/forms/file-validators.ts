import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Límite de spring.servlet.multipart.max-file-size en el backend. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Extensiones que exige cada endpoint (UploadedFile.requireExtension en el backend). */
export const FILE_TYPES = {
  ecore: ['.ecore'],
  genmodel: ['.genmodel'],
  atl: ['.atl'],
  acceleo: ['.mtl'],
  model: ['.xmi', '.xml'],
} as const;

/** Valor para el atributo accept de un input file. */
export function acceptOf(extensions: readonly string[]): string {
  return extensions.join(',');
}

/** El archivo debe terminar en una de las extensiones (sin distinguir mayúsculas). */
export function fileExtension(extensions: readonly string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value as File | null;
    if (!file) {
      return null;
    }
    const name = file.name.toLowerCase();
    return extensions.some((ext) => name.endsWith(ext)) ? null : { fileExtension: { allowed: extensions } };
  };
}

/** Evita subir archivos que el backend rechazaría con 413 o como vacíos. */
export function fileSize(maxBytes = MAX_UPLOAD_BYTES): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value as File | null;
    if (!file) {
      return null;
    }
    if (file.size === 0) {
      return { fileEmpty: true };
    }
    return file.size > maxBytes ? { fileSize: { max: maxBytes } } : null;
  };
}

/** Validadores estándar de un archivo: extensión permitida y tamaño. */
export function fileValidators(extensions: readonly string[]): ValidatorFn[] {
  return [fileExtension(extensions), fileSize()];
}

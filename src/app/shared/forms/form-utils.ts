/** Texto opcional: '' o solo espacios se envían como null (los campos opcionales del backend). */
export function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Nombre sugerido a partir de un archivo: "hyperledgerGo.ecore" → "hyperledgerGo". */
export function baseName(file: File | null | undefined): string {
  if (!file) {
    return '';
  }
  const dot = file.name.lastIndexOf('.');
  return dot > 0 ? file.name.substring(0, dot) : file.name;
}

/** Límites de las columnas en la base de datos (VARCHAR 255 y description length = 1000). */
export const NAME_MAX_LENGTH = 255;
export const DESCRIPTION_MAX_LENGTH = 1000;

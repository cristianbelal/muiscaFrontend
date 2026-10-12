type FormValue = string | number | boolean | File | Blob | null | undefined;

/**
 * Construye un multipart/form-data omitiendo los valores vacíos, porque los
 * @RequestParam(required = false) del backend esperan que el campo no se envíe.
 */
export function toFormData(fields: Record<string, FormValue>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    if (value instanceof Blob) {
      data.append(key, value, value instanceof File ? value.name : key);
    } else {
      data.append(key, String(value));
    }
  }
  return data;
}

/** Referencia breve a otro recurso (dto/Reference.java). */
export interface Reference {
  id: number;
  name: string;
}

export type ProblemSeverity = 'ERROR' | 'WARNING';

/** Error o advertencia de compilación/validación (port/ArtifactProblem.java). */
export interface ArtifactProblem {
  severity: ProblemSeverity;
  line: number | null;
  message: string;
}

/** Fecha LocalDateTime serializada por Jackson en ISO-8601 sin zona horaria. */
export type IsoDateTime = string;

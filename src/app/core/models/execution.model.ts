import { IsoDateTime } from './common.model';

/** domain/model/ExecutionStatus.java */
export type ExecutionStatus = 'SUCCEEDED' | 'FAILED';

/** domain/repository/ExecutionSummary.java: vista del historial sin archivos. */
export interface ExecutionSummary {
  id: number;
  transformationId: number | null;
  transformationName: string;
  executedBy: string;
  status: ExecutionStatus;
  inputModelName: string;
  errorMessage: string | null;
  durationMs: number;
  createdAt: IsoDateTime;
}

/** Claves del mapa de descargas que arma ExecutionResponse.from(). */
export type ExecutionArtifact = 'inputModel' | 'outputModel' | 'generatedCode' | 'generatedFiles';

/** dto/ExecutionResponse.java. downloads contiene rutas relativas a la API. */
export interface Execution {
  id: number;
  transformationId: number | null;
  transformationName: string;
  executedBy: string;
  status: ExecutionStatus;
  inputModelName: string;
  outputModelName: string | null;
  generatedFiles: string[];
  errorMessage: string | null;
  durationMs: number;
  createdAt: IsoDateTime;
  downloads: Partial<Record<ExecutionArtifact, string>>;
}

/** dto/GeneratedFile.java: archivo de código generado para previsualizar. */
export interface GeneratedFile {
  path: string;
  content: string;
}

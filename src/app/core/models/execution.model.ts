import { IsoDateTime } from './common.model';

/** domain/model/ExecutionStatus.java. RUNNING: en cola o procesándose en segundo plano. */
export type ExecutionStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

/** domain/model/ExecutionStage.java: etapa en curso mientras está RUNNING. */
export type ExecutionStage = 'QUEUED' | 'ATL' | 'ACCELEO';

/** domain/repository/ExecutionSummary.java: vista del historial sin archivos. */
export interface ExecutionSummary {
  id: number;
  transformationId: number | null;
  transformationName: string;
  executedBy: string;
  status: ExecutionStatus;
  stage: ExecutionStage | null;
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
  stage: ExecutionStage | null;
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

/** dto/PageResponse.java */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ExecutionSearch {
  page: number;
  size: number;
  status?: ExecutionStatus | null;
  q?: string | null;
}

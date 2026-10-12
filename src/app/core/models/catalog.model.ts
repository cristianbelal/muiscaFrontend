import { ArtifactProblem, IsoDateTime, Reference } from './common.model';

/** dto/MetamodelResponse.java */
export interface Metamodel {
  id: number;
  name: string;
  description: string | null;
  nsUri: string;
  ecoreFileName: string;
  hasGenmodel: boolean;
  createdBy: string;
  createdAt: IsoDateTime;
  warnings: ArtifactProblem[];
}

/** domain/model/AtlCompiler.java */
export type AtlCompiler = 'EMFTVM' | 'ATL2006';

/** dto/AtlModuleResponse.java */
export interface AtlModule {
  id: number;
  name: string;
  description: string | null;
  moduleName: string;
  compiler: AtlCompiler;
  sourceMetamodel: Reference;
  inModelName: string;
  sourceAlias: string;
  targetMetamodel: Reference;
  outModelName: string;
  targetAlias: string;
  createdBy: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  warnings: ArtifactProblem[];
}

/** dto/AcceleoModuleResponse.java */
export interface AcceleoModule {
  id: number;
  name: string;
  description: string | null;
  moduleName: string;
  mainTemplate: string;
  metamodel: Reference;
  createdBy: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  warnings: ArtifactProblem[];
}

/** dto/TransformationResponse.java */
export interface Transformation {
  id: number;
  name: string;
  description: string | null;
  inputMetamodel: Reference;
  outputMetamodel: Reference | null;
  atlModule: Reference | null;
  acceleoModule: Reference | null;
  producesModel: boolean;
  producesCode: boolean;
  published: boolean;
  createdBy: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** dto/TransformationRequest.java: al menos una de las dos etapas es obligatoria. */
export interface TransformationRequest {
  name: string;
  description: string | null;
  inputMetamodelId: number;
  atlModuleId: number | null;
  acceleoModuleId: number | null;
}

/** dto/AtlCompilationResponse.java */
export interface AtlCompilation {
  valid: boolean;
  compiler: AtlCompiler | null;
  moduleName: string | null;
  inModelName: string | null;
  sourceAlias: string | null;
  outModelName: string | null;
  targetAlias: string | null;
  problems: ArtifactProblem[];
}

/** dto/TemplateCompilationResponse.java */
export interface TemplateCompilation {
  valid: boolean;
  moduleName: string | null;
  mainTemplate: string | null;
  problems: ArtifactProblem[];
}

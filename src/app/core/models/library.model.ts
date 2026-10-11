import { IsoDateTime, Reference } from './common.model';

/** dto/StoredModelResponse.java: modelo de la biblioteca del usuario. */
export interface StoredModel {
  id: number;
  name: string;
  description: string | null;
  metamodel: Reference;
  fileName: string;
  sizeBytes: number;
  owner: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** dto/MetadataRequest.java: renombrar un recurso sin tocar su archivo. */
export interface MetadataRequest {
  name: string;
  description: string | null;
}

/** dto/SystemSettingsResponse.java */
export interface SystemSettings {
  registrationEnabled: boolean;
  announcement: string | null;
  updatedBy: string | null;
  updatedAt: IsoDateTime | null;
}

/** dto/PublicSettingsResponse.java: lo que ve la pantalla de acceso sin sesión. */
export interface PublicSettings {
  registrationEnabled: boolean;
  announcement: string | null;
}

/** dto/SettingsRequest.java */
export interface SettingsRequest {
  registrationEnabled: boolean;
  announcement: string | null;
}

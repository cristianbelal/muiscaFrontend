/** Roles del sistema (domain/model/Role.java). */
export type Role = 'ADMIN' | 'MODEL_ENGINEER' | 'USER';

export const ROLES: readonly Role[] = ['ADMIN', 'MODEL_ENGINEER', 'USER'];

/** Roles que pueden gestionar el catálogo (Permissions.canManageCatalog). */
export const CATALOG_MANAGER_ROLES: readonly Role[] = ['ADMIN', 'MODEL_ENGINEER'];

/** dto/UserResponse.java. localAccount = false si la cuenta solo inicia sesión con Google. */
export interface User {
  id: number;
  username: string;
  role: Role;
  localAccount: boolean;
}

/** dto/CreateUserRequest.java */
export interface CreateUserRequest {
  username: string;
  password: string;
  role: Role;
}

/** dto/UpdateUserRequest.java: solo se actualizan los campos informados. */
export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: Role;
}

/** dto/AuthResponse.java */
export interface AuthResponse {
  token: string;
}

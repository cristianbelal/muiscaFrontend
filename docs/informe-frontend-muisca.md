# Informe de análisis y completitud del frontend MUISCA

Fecha: 2026-10-05 · Rama: `feature/claude-recommendations`

---

## 1. Resumen ejecutivo

El prototipo Angular había quedado desalineado con el backend. El backend evolucionó a una
arquitectura hexagonal con un **catálogo de transformaciones** (Metamodelo → Módulo ATL →
Plantilla Acceleo → Transformación → Ejecución) y tres roles. El frontend, en cambio, seguía
llamando a endpoints que ya no existen (`/api/atl/transform`, `/api/atl/files`, `/auth/delete`).
Solo el inicio de sesión funcionaba, y aun así la redirección por rol fallaba: comparaba
`'ROLE_ADMIN'` cuando el backend devuelve `'ADMIN'`.

Se reorganizó el proyecto en capas `core / shared / layout / features`. Los cinco componentes
existentes se reubicaron con `git mv`, que conserva su historial, y se reescribieron contra los
endpoints reales. Además se construyeron las pantallas que faltaban. Hoy la interfaz cubre
**40 de los 44 endpoints** del backend. Los 4 restantes son `GET /{id}` de recursos cuyo
listado ya trae los mismos datos; sus métodos existen en los clientes de la API.

| Indicador | Antes | Después |
| --- | --- | --- |
| Endpoints reales consumidos | 3 de 44 (y 4 llamadas a rutas inexistentes) | 40 de 44 |
| Pantallas funcionales (rutas) | 1 (login) | 14 |
| Roles soportados | 1 comparación de rol errónea | ADMIN, MODEL_ENGINEER y USER |
| Manejo de errores | `alert()`, `console.log`, `error.message` de HttpClient | Interceptor central + mensajes del backend |
| Pruebas unitarias | 10 specs "should create" (fallarían) | 35 pruebas, todas pasan |
| Librería de UI | Bootstrap 4 CSS + Bootstrap 5 JS por CDN (versiones mezcladas) | Angular Material 19 |

---

## 2. Fase 1: análisis del frontend existente

### 2.1 Arquitectura encontrada

- Angular 19.1, componentes standalone y bootstrap con `appConfig`, sin módulos NgModule.
- Sin capas: los servicios estaban en `src/app/` y en `services/`, los componentes en
  `components/` y en la raíz.
- **Angular Material no estaba instalado**, aunque se pedía mantenerlo. Se usaba Bootstrap 4.0
  (CSS) junto con el bundle JS de Bootstrap 5.3; los dropdowns no funcionaban por esa mezcla.
- Sin lazy loading, sin interceptores, sin entornos (`environment.ts`) y con las URL
  `http://localhost:8080` repetidas en cada servicio.
- El token se adjuntaba a mano en cada llamada (`headers: { Authorization: ... }`).

### 2.2 Inventario y estado

| Elemento | Estado | Observación |
| --- | --- | --- |
| `LoginComponent` | ⚠️ Parcial | Funcionaba con usuario/contraseña y Google, pero redirigía mal por el rol. Formularios template-driven, error mostrado dos veces, botón "Cancelar" hacia la ruta inexistente `/atl`, 140 líneas de código comentado. |
| Botón de Facebook | ❌ Simulado | `signInWithFacebook` hacía `POST ''` y el SDK tenía `appId: "TU_APP_ID_DE_FACEBOOK"`. El backend no tiene endpoint de Facebook. |
| Botón de LinkedIn | ❌ Simulado | Botón sin acción. |
| `AtlComponent` (`atlAdminView`) | ❌ Roto | Llamaba a `POST /api/atl/transform`, que no existe. Tenía un `select` "Modelos de entrada" sin binding y opciones fijas (`Go2Java`, `tipo2`, `tipo3`). |
| `AtlClientViewComponent` (`atlUserView`) | ❌ Roto | Usaba `/api/atl/files` y `/api/atl/files/upload` (no existen). `subirArchivoAlBackend`, `agregarArchivoAlBackend`, `eliminarCuenta` y `editarCuenta` estaban vacíos. La descarga usaba `[href]="archivo.id"`. Había un `*ng` inválido en la plantilla. |
| `EjecutarTransformacionComponent` | ❌ Stub | Sin ruta. Tres inputs con el mismo `id` y un `onSubmit` que solo hacía `console.log`. |
| `ListadoTransformacionesComponent` (`/list`) | ❌ Stub | "listado-transformaciones works!". |
| `AdminGuard` | ❌ Roto | Clase `CanActivate` (API obsoleta). Leía el rol cacheado en `localStorage` (manipulable) y lo comparaba con `'ROLE_ADMIN'`. Usaba `alert('Ojito...')`. |
| `AuthService` | ⚠️ Parcial | `deleteUser` llamaba a `/auth/validate` con DELETE; `updateUser` tenía fijo `/api/users/3`. |
| `AtlService`, `FilesService` | ❌ Obsoletos | Apuntaban a endpoints eliminados del backend. |
| Specs | ❌ | Las 10 specs fallarían: no proveen `HttpClient` y `app.component.spec` busca "Hello, zenodoMuisca". |

### 2.3 Problemas transversales

- **Arquitectura:** lógica duplicada (`onFileChange`, `onSubmit` y `logout` copiados entre
  las dos vistas ATL); sin una capa de acceso a datos tipada (`Observable<any>`); validación de
  sesión repetida en cada `ngOnInit`.
- **Seguridad y UX:** el guard confiaba en `userData.role` de `localStorage`; los errores se
  mostraban como `Error: Http failure response for ...`.
- **UX/UI:** sin navegación entre pantallas, textos técnicos, ninguna explicación para
  usuarios no expertos, sin estados de carga ni vacíos, sin `lang="es"`.
- **Nomenclatura:** el título era `ZenodoMuisca` y se mezclaban `atlAdminView`, `list` y
  `ejecutar-transformacion` (Spanglish).

---

## 3. Fase 2: análisis del backend (fuente de verdad)

### 3.1 Arquitectura

Spring Boot con arquitectura hexagonal:

- `domain/model`: entidades JPA (`Metamodel`, `AtlModule`, `AcceleoModule`, `Transformation`,
  `Execution`, `UserEntity`) y los enums `Role`, `AtlCompiler` y `ExecutionStatus`.
- `domain/repository`: repositorios Spring Data, más la proyección `ExecutionSummary`, que
  lista sin cargar los BLOB.
- `application`: servicios (casos de uso), DTO como records, excepciones de negocio y puertos
  (`ModelTransformationEngine`, `CodeGenerationEngine`, `MetamodelInspector`).
- `infrastructure`: motores EMF/ATL/EMFTVM/Acceleo, seguridad JWT (HS512, 24 h), controladores
  REST y `GlobalExceptionHandler`.

### 3.2 Roles y reglas de autorización

- **ADMIN:** todo, incluida la gestión de usuarios y la publicación de transformaciones.
- **MODEL_ENGINEER:** metamodelos, módulos ATL y Acceleo, espacio de trabajo y definición de
  transformaciones (sin publicarlas).
- **USER:** ve y ejecuta las transformaciones publicadas y gestiona sus propias ejecuciones.
- **Recursos:** solo el creador o un ADMIN modifica o elimina un recurso
  (`Permissions.requireOwnerOrAdmin`).
- **Rol leído de la BD:** el rol se lee de la base de datos en cada petición, no del token,
  así que un cambio de rol aplica de inmediato.

### 3.3 Reglas de negocio relevantes para la UI

| Regla | Origen |
| --- | --- |
| Una transformación necesita al menos una etapa: ATL y/o Acceleo | `TransformationService.validateChain` |
| El ATL debe recibir el metamodelo de entrada; Acceleo recibe la salida del ATL (o la entrada si no hay ATL) | `validateChain` |
| El rol USER solo ve las transformaciones publicadas; las no publicadas "no existen" (404) | `findVisible` |
| La ejecución responde 201 si termina bien y **422 si el motor falla**; ambas quedan en el historial | `TransformationController.execute` |
| Un modelo no conforme da 400 con `problems` y **no** registra la ejecución | `ExecutionService.execute` |
| Extensiones obligatorias: `.ecore`, `.genmodel`, `.atl`, `.mtl`, `.xmi/.xml`; ningún archivo vacío; máximo 10 MB | `UploadedFile.requireExtension`, `application.properties` |
| El nsURI del metamodelo es único; los nombres de metamodelo, módulo y transformación también | servicios |
| No se puede eliminar un metamodelo o módulo que esté en uso | servicios |
| Un ADMIN no puede quitarse su propio rol ni eliminarse; debe quedar al menos un ADMIN | `UserService.requireAnotherAdmin` |
| Un usuario con datos asociados no se puede eliminar: hay que cambiarle el rol | `UserService.delete` |
| El auto-registro siempre crea cuentas USER | `AuthController.register` |
| Las cuentas de Google no tienen contraseña local (`localAccount = false`) | `UserResponse` |
| Formato de error: `{ timestamp, status, error, message, errors?, problems? }` | `GlobalExceptionHandler` |

### 3.4 Endpoints expuestos (44)

| Controlador | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/validate` |
| OAuth | `POST /oauth/google` |
| Users | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/{id}` |
| Metamodels | `GET/POST /api/metamodels`, `GET/DELETE /{id}`, `GET /{id}/ecore` |
| ATL | `GET/POST /api/atl-modules`, `GET/DELETE /{id}`, `GET/PUT /{id}/source` |
| Acceleo | `GET/POST /api/acceleo-modules`, `GET/DELETE /{id}`, `GET/PUT /{id}/source` |
| Transformations | `GET/POST /api/transformations`, `GET/PUT/DELETE /{id}`, `PATCH /{id}/publication`, `POST /{id}/executions` |
| Executions | `GET /api/executions`, `GET/DELETE /{id}`, `GET /{id}/input-model`, `/output-model`, `/generated-code`, `/generated-files` |
| Workspace | `POST /api/workspace/atl/compile`, `/atl/run`, `/acceleo/compile`, `/acceleo/run` |

---

## 4. Fase 3: GAP analysis

| Proceso de negocio | Backend | Frontend antes | Frontend ahora |
| --- | --- | --- | --- |
| Iniciar sesión (usuario/contraseña) | ✅ | ⚠️ Rol mal comparado | ✅ |
| Iniciar sesión con Google | ✅ | ⚠️ Sin rol ni `userData` tras el login | ✅ |
| Auto-registro | ✅ | ❌ No consumido | ✅ |
| Restaurar sesión / sesión expirada | ✅ (401) | ⚠️ Solo en el login | ✅ Al arrancar y ante cualquier 401 |
| Catálogo de transformaciones | ✅ | ❌ | ✅ |
| Ejecutar una transformación | ✅ | ❌ Endpoint inexistente | ✅ |
| Historial de ejecuciones | ✅ | ❌ | ✅ |
| Descargar modelo de entrada/salida y ZIP de código | ✅ | ❌ `href` con un id | ✅ (Blob autenticado) |
| Previsualizar contratos generados | ✅ `generated-files` | ❌ | ✅ |
| Eliminar ejecuciones | ✅ | ❌ | ✅ |
| CRUD de metamodelos | ✅ | ❌ | ✅ |
| CRUD de módulos ATL + actualizar código | ✅ | ❌ | ✅ |
| CRUD de plantillas Acceleo + actualizar código | ✅ | ❌ | ✅ |
| Definir transformaciones (cadena validada) | ✅ | ❌ | ✅ |
| Publicar / retirar transformaciones | ✅ | ❌ | ✅ (solo ADMIN) |
| Espacio de trabajo ATL (compilar / ejecutar) | ✅ | ❌ | ✅ |
| Espacio de trabajo Acceleo (compilar / generar) | ✅ | ❌ | ✅ |
| Gestión de usuarios y roles | ✅ | ⚠️ `PUT /api/users/3` fijo y sin UI | ✅ |
| Facebook / LinkedIn | ❌ No existe | Botones simulados | Retirados (sin backend) |
| "Editar / eliminar mi cuenta" | ❌ No existe para USER | Menú sin acción | "Mi cuenta" en solo lectura |

**Endpoints del backend sin consumir en pantalla:** `GET /api/users/{id}`,
`GET /api/metamodels/{id}`, `GET /api/atl-modules/{id}`, `GET /api/acceleo-modules/{id}`.
Están implementados en los clientes de la API; ninguna pantalla los necesita porque el listado
devuelve los mismos campos.

---

## 5. Fase 4: cambios realizados

Cada cambio se presenta con el problema, la solución, los archivos y la justificación. El código
completo está en los archivos enlazados.

### 5.1 Base técnica

**Problema.** Angular Material no estaba instalado; Bootstrap 4 CSS y Bootstrap 5 JS se cargaban
desde CDN (incompatibles entre sí); había un SDK de Facebook con un `appId` de ejemplo; no
existían entornos y las URL estaban fijas en el código.

**Solución.**
- Se instaló `@angular/material@19` y `@angular/cdk@19` con el tema M3 prebuilt `azure-blue`, que
  no exige migrar a SCSS. Se retiraron Bootstrap y `bootstrap-icons`.
- Se crearon `src/environments/environment.ts` y `environment.development.ts` (con
  `fileReplacements`), que contienen `apiUrl` y `googleClientId`.
- `index.html`: `lang="es"`, título "MUISCA", fuentes Roboto y Material Icons, script de Google
  Identity; se eliminó el SDK de Facebook.
- `styles.css`: utilidades de layout, tablas, insignias y mensajes basados en tokens
  `--mat-sys-*`; soporte de `prefers-reduced-motion`.
- El presupuesto del bundle inicial pasó de 500 kB a 800 kB (aviso). El inicial real es de
  684 kB sin comprimir y 167 kB transferidos, un tamaño habitual en una app con Material.

**Archivos.** `package.json`, `angular.json`, `src/index.html`, `src/styles.css`,
`src/environments/*`.

**Justificación.** Cumple el requisito de usar Angular Material y elimina una mezcla de versiones
que rompía los componentes interactivos. Los tokens M3 dan consistencia visual sin CSS por
componente.

### 5.2 Capa core: modelos y clientes de la API

**Problema.** Se usaba `Observable<any>`, las URL estaban repetidas y no había tipos de
dominio.

**Solución.** `core/models` replica 1:1 los DTO (`MetamodelResponse`, `AtlModuleResponse`,
`TransformationResponse`, `ExecutionResponse`, `ExecutionSummary`, `UserResponse`,
`ArtifactProblem`, etc.). `core/api` tiene un cliente por controlador
(`MetamodelApi`, `AtlModuleApi`, `AcceleoModuleApi`, `TransformationApi`, `ExecutionApi`,
`UserApi`, `WorkspaceApi`) que respeta los nombres exactos de los parámetros multipart
(`ecoreFile`, `genmodelFile`, `atlFile`, `templateFile`, `inputModel`, `sourceMetamodel`...).
`toFormData` omite los campos vacíos porque los `@RequestParam(required=false)` esperan que el
campo no se envíe.

**Justificación (Clean Architecture/DDD).** Los componentes dependen de puertos tipados y no de
`HttpClient`. Si cambia un contrato, solo se toca un archivo.

### 5.3 Autenticación y autorización

**Problema.** El rol se comparaba con `'ROLE_ADMIN'`, el guard confiaba en `localStorage` y el
token se adjuntaba a mano; la validación de sesión estaba copiada en cada componente.

**Solución.**
- `AuthService` (signals `user`, `role`, `isAdmin`, `canManageCatalog`). Tras el login siempre
  consulta `/auth/validate`, igual que el backend, que lee el rol de la BD.
- `provideAppInitializer` restaura la sesión antes de la primera navegación, así que los guards
  son síncronos y no hay parpadeos.
- Guards funcionales `authGuard` (conserva `returnUrl`), `guestGuard` y `roleGuard` (roles en
  `route.data`, replicando `SecurityConfig`).
- `authInterceptor` adjunta el Bearer solo a peticiones dirigidas al backend.
- `safeReturnUrl` evita redirecciones abiertas.
- `GoogleIdentityService` encapsula Google Identity Services con tipos y un tiempo máximo de
  espera (antes hacía polling infinito con `@ts-ignore`).

**Archivos.** `core/auth/*`.

**Justificación.** La única fuente de verdad del rol es el backend. Los guards solo evitan
mostrar pantallas que responderían 403.

### 5.4 Manejo centralizado de errores

**Problema.** Se usaban `alert()` y `console.log` y se mostraba `error.message` de HttpClient,
que es técnico y está en inglés.

**Solución.**
- `ApiError` normaliza el cuerpo de `GlobalExceptionHandler`: `message`, `errors[]` y
  `problems[]`. También soporta texto plano (`/oauth/google`) y cuerpos `Blob` de las descargas.
- `errorInterceptor` hace dos cosas:
  - ante un 401 cierra la sesión y lleva al login con `returnUrl`;
  - en los demás errores muestra el mensaje del backend en un snackbar.
- `SILENT_ERRORS` / `silentErrors()` sirven para las pantallas que muestran el error en línea:
  formularios con problemas de compilación y la ejecución de transformaciones.
- `ApiErrorPanelComponent` presenta el mensaje, los errores de campo y la lista de problemas.

**Archivos.** `core/http/*`, `core/notifications/notification.service.ts`,
`shared/components/api-error-panel`.

### 5.5 Componentes reutilizables (shared)

| Componente | Uso |
| --- | --- |
| `FilePickerComponent` | `ControlValueAccessor` con arrastrar y soltar y errores de extensión, tamaño y archivo vacío. Se usa en 8 formularios. |
| `file-validators.ts` | Replica `requireExtension` y el límite de 10 MB. |
| `ProblemListComponent` | Errores y advertencias de compilación al estilo de la vista "Problems" de Eclipse. |
| `TransformationChainComponent` | Explica visualmente qué hace una transformación: Modelo → ATL → Modelo → Acceleo → Código. |
| `ExecutionResultComponent` | Estado, descargas y vista previa del código; lo comparten la ejecución y el detalle. |
| `CodeViewerComponent` | Varios archivos, copiar y descargar. |
| `PageHeader`, `EmptyState`, `StatusBadge` | Consistencia visual. |
| `DialogService`, `ConfirmDialog`, `ProblemsDialog`, `SourceUpdateDialog` | Diálogos accesibles; reemplazan `window.confirm`. |
| Pipes `roleLabel`, `duration`, `fileSize` | Presentación en español. |

### 5.6 Reubicación de los componentes existentes

Los componentes se movieron con `git mv`, por lo que se conserva su historial. Las rutas
antiguas redirigen a las nuevas para no romper enlaces guardados.

| Antes | Ahora | Motivo |
| --- | --- | --- |
| `login/` | `features/auth/login/` | Reactive Forms, rol corregido, `returnUrl`, sin Facebook/LinkedIn |
| `listado-transformaciones/` (`/list`) | `features/catalog/transformation-catalog/` (`/catalogo`) | Implementado: tarjetas con "Usted sube / Usted recibe", búsqueda sin tildes y filtros |
| `ejecutar-transformacion/` | `features/catalog/execute-transformation/` (`/catalogo/:id/ejecutar`) | Implementado: flujo en 3 pasos y manejo del 422 como resultado |
| `components/atl-client-view/` (`/atlUserView`) | `features/home/` (`/inicio`) | Era la página inicial del usuario. Ahora es el inicio de todos los roles: guía de 3 pasos, accesos por rol, métricas del catálogo y ejecuciones recientes |
| `components/atl-admin-view/` (`/atlAdminView`) | `features/workspace/atl-workspace/` (`/espacio-trabajo`) | Su formulario (modelo + metamodelo de entrada y de salida) es exactamente `POST /api/workspace/atl/run` |
| `services/auth/`, `guards/` | `core/auth/` | Capa core |
| `atl.service.ts`, `services/files/` | Eliminados | Endpoints inexistentes en el backend |

### 5.7 Pantallas nuevas

| Ruta | Pantalla | Endpoints |
| --- | --- | --- |
| `/registro` | Crear cuenta | `POST /auth/register` + login |
| `/ejecuciones` | Historial con filtros por estado, búsqueda y paginación | `GET`, `DELETE /api/executions` |
| `/ejecuciones/:id` | Detalle, descargas y contratos generados | `GET /{id}`, `/input-model`, `/output-model`, `/generated-code`, `/generated-files` |
| `/metamodelos` | Listado, registro (sugiere el nombre a partir del archivo), descarga y eliminación | `/api/metamodels/**` |
| `/modulos-atl` | Listado, registro con "Verificar compilación" (cabecera detectada), actualizar código y eliminar | `/api/atl-modules/**`, `/api/workspace/atl/compile` |
| `/plantillas-acceleo` | Igual que ATL; la verificación descarga el `.ecore` del metamodelo elegido | `/api/acceleo-modules/**`, `/api/workspace/acceleo/compile` |
| `/transformaciones` | Definir y editar con la cadena validada en cliente, vista previa, publicar o retirar (ADMIN), probar | `/api/transformations/**` |
| `/espacio-trabajo` | Pestañas ATL (vista previa del XMI de salida) y Acceleo (ZIP) | `/api/workspace/**` |
| `/usuarios` | Usuarios y roles; solo envía los campos modificados | `/api/users/**` |
| `/cuenta` | Datos de la cuenta, permisos del rol y "Actualizar permisos" | `GET /auth/validate` |

### 5.8 Experiencia de usuario y accesibilidad

- **Navegación:** menú lateral agrupado (Transformar / Modelado / Administración) que muestra
  solo lo que permite el rol; responsive (en móvil se abre como panel superpuesto).
- **Lenguaje:** sencillo para usuarios no expertos. Por ejemplo: "Usted sube un modelo .xmi
  de HyperledgerGo, usted recibe el código del contrato".
- **Estados:** carga (`mat-progress-bar`), vacío (con la acción sugerida) y error en línea.
- **Validación previa:** se valida antes de enviar con las mismas reglas del backend, y los
  mensajes del backend se muestran tal cual (ya vienen en español).
- **Accesibilidad:**
  - enlace "Saltar al contenido principal", `aria-label` en todos los botones de icono,
    `aria-live` en los resultados y `role="alert"` en los errores;
  - estados que no dependen solo del color (llevan icono y texto);
  - título de pestaña por ruta (`MuiscaTitleStrategy`);
  - locale `es-CO` y paginador en español.
- **Seguridad de la UX:** confirmación en cada eliminación, con texto que explica la
  consecuencia. Las acciones que el backend rechazaría por propiedad aparecen deshabilitadas
  y con un tooltip que explica el motivo.

### 5.9 Pruebas

35 pruebas (Karma + Jasmine, Chrome headless), todas pasan:

- `ApiError`: JSON con `problems`, Blob, texto plano y error de red.
- `filenameFrom`: `Content-Disposition` con `filename*=UTF-8''`.
- `AuthService`: login + validate, credenciales erróneas, token vencido, `canModify` y
  `safeReturnUrl`.
- Guards: redirección con `returnUrl`, bloqueo del rol USER y acceso del MODEL_ENGINEER.
- `TransformationApi`: parámetro `inputModel`, **422 convertido en ejecución FAILED**, 400 con
  `problems` y el filtro `published`.
- Validadores de archivo y specs de los componentes reubicados.

---

## 6. Arquitectura final

```
                    ┌──────────────────────── features (lazy) ────────────────────────┐
  Router ─ guards ─▶│ auth · home · catalog · executions · metamodels · atl-modules   │
                    │ acceleo-modules · transformations · workspace · users · account │
                    └───────────────┬─────────────────────────────────┬───────────────┘
                                    │ usa                             │ usa
                    ┌───────────────▼──────────────┐  ┌───────────────▼──────────────┐
                    │ shared: componentes, diálogos,│  │ layout/shell (menú por rol)  │
                    │ pipes, validadores            │  └──────────────────────────────┘
                    └───────────────┬──────────────┘
                                    │
                    ┌───────────────▼──────────────────────────────────────────────────┐
                    │ core: models · api/* · auth (signals, guards, interceptor)        │
                    │       http (ApiError, errorInterceptor) · files · notifications   │
                    └───────────────┬──────────────────────────────────────────────────┘
                                    │ HTTP + JWT
                    ┌───────────────▼──────────────┐
                    │ Backend Spring Boot (muisca) │
                    └──────────────────────────────┘
```

Las dependencias van solo hacia abajo: `features → shared → core`. `core` no conoce la UI.

---

## 7. Funcionalidades pendientes

| Pendiente | Motivo |
| --- | --- |
| Autogestión de la cuenta (cambiar mi contraseña o eliminar mi cuenta) para USER y MODEL_ENGINEER | No hay endpoint: `/api/users` es solo para ADMIN. Requiere un endpoint nuevo, fuera del alcance permitido. |
| Biblioteca de modelos (guardar modelos para reutilizarlos) | El backend no tiene una entidad Modelo; los modelos solo existen como entrada y salida de una ejecución, y esos sí se gestionan desde el historial. |
| Configuraciones del sistema más allá de usuarios y roles | El backend no expone parámetros configurables. |
| Login con Facebook o LinkedIn | No hay endpoints en el backend. |
| Editar nombre o descripción de metamodelos y módulos | El backend solo permite actualizar el código fuente (`PUT /{id}/source`). |
| Prueba end-to-end con el backend en ejecución | No se arrancó el backend porque escribiría en la base MySQL local (`ddl-auto=update` y el sembrado del catálogo). Se recomienda una prueba manual con los modelos de `muisca/src/main/resources/mde/models`. |

---

## 8. Riesgos identificados

1. **JWT en `localStorage`.** Se conservó la clave `token` del prototipo; es vulnerable a XSS.
   La alternativa (cookie httpOnly) requiere cambios en el backend.
2. **Sin refresh token.** El JWT dura 24 h. Al vencer, el usuario vuelve al login; se informa y
   se conserva `returnUrl`.
3. **CORS fijo en `http://localhost:4200`.** Cualquier despliegue exige actualizar
   `SecurityConfig` y `environment.ts`.
4. **Ejecución síncrona.** Una transformación larga mantiene abierta la petición HTTP y no
   reporta progreso; la UI muestra una barra indeterminada.
5. **Listados sin paginación en el backend.** El filtrado y la paginación se hacen en el
   cliente. El historial del ADMIN puede crecer mucho.
6. **Los errores 500 exponen `e.getMessage()`** en `GlobalExceptionHandler`; pueden mostrar
   detalles internos al usuario.
7. **Client ID de Google en el código del frontend.** No es un secreto, pero conviene definirlo
   por entorno.

---

## 9. Recomendaciones futuras

1. **Backend (requiere aprobación):**
   - `PUT /api/me/password` para la autogestión de la cuenta;
   - paginación (`Pageable`) en `/api/executions`;
   - mensajes genéricos en los errores 500;
   - cookie httpOnly + refresh token.
2. **Ejecución asíncrona:** cola con estado `RUNNING`, consultada por polling o SSE, para
   mostrar progreso real.
3. **Espacio de trabajo:** permitir elegir metamodelos ya registrados en lugar de subir el
   `.ecore` (`MetamodelApi.fetchEcore` ya lo permite técnicamente).
4. **Pruebas E2E** (Playwright) del flujo completo con los modelos de ejemplo `SCGo.xmi` y
   `SCJava.xmi`.
5. **Resaltado de sintaxis** en el visor de código (Solidity, Go, Java) con una librería ligera
   cargada bajo demanda.
6. **Internacionalización** con `@angular/localize` si se requiere una versión en inglés para
   publicaciones académicas.

---

## 10. Actualización (2026-10-11 y 2026-10-12): prototipo completo y desplegado

Con autorización para modificar el backend, se cerraron los pendientes de la sección 7 y se
implementaron las recomendaciones de la sección 9.

| Antes pendiente / recomendado | Estado |
| --- | --- |
| Autogestión de la cuenta | Hecho: `/api/account` (cambiar contraseña, eliminar la propia cuenta) y pantalla Mi cuenta |
| Biblioteca de modelos | Hecho: `/api/models`; el metamodelo se detecta por el nsURI; se ejecuta desde un modelo guardado y se guarda el modelo transformado para encadenar transformaciones |
| Configuración del sistema | Hecho: `/api/settings` (registro abierto/cerrado, aviso global) y pantalla Configuración (ADMIN) |
| Editar nombre/descripción de metamodelos y módulos | Hecho: `PATCH` en los tres recursos |
| Ejecución asíncrona con progreso | Hecho: `?async=true` (202 RUNNING), etapas QUEUED → ATL → ACCELEO, cola de un hilo para 512 MB |
| Paginación del historial en el backend | Hecho: `/api/executions/search` con filtros por estado y texto |
| Espacio de trabajo con metamodelos registrados | Hecho: selector que descarga el `.ecore` del catálogo |
| Resaltado de sintaxis | Hecho: highlight.js + Solidity, cargado bajo demanda |
| Modelo de ejemplo de Solidity | Ya existía (`SContractPatientSol.xmi`); ahora los ejemplos se ofrecen en la pantalla de ejecución |
| Pruebas E2E en CI | Hecho: prueba de integración de punta a punta de la API (H2) en GitHub Actions |
| Errores 500 sin detalles internos | Hecho |
| Aviso del resultado de la ejecución | Hecho: notificación de éxito/fallo y desplazamiento al resultado |
| Sesión en cookie httpOnly | No implementado: frontend y API están en subdominios distintos de `onrender.com` (sufijo público), así que la cookie sería de terceros y los navegadores la bloquean. Requiere servir ambos bajo un mismo dominio |

**Base de datos.** El backend corre sobre MySQL y PostgreSQL sin cambios de código. En la nube
usa PostgreSQL (Render) y en desarrollo, MySQL. El ambiente de laboratorio detectó un defecto que
solo se manifiesta en PostgreSQL (los `NULL` de columnas binarias); se corrigió antes de pasar a
producción.

**Despliegue.** Render (plan gratuito): dos entornos, Laboratorio (rama `lab`) y Producción
(rama `main`), con despliegue automático al hacer merge si el CI pasa. Detalle en
`muisca/docs/DESPLIEGUE.md`.

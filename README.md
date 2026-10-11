# MUISCA · Frontend

Interfaz web de MUISCA: ejecución de transformaciones dirigidas por modelos (ATL + Acceleo) que
generan contratos inteligentes para Hyperledger Fabric y Ethereum.

- Angular 19 (componentes standalone, signals, control flow `@if/@for`)
- Angular Material 19 (tema M3 `azure-blue`)
- Backend: Spring Boot en `../muisca` (fuente oficial de las reglas de negocio)

## Puesta en marcha

```bash
npm install
npm start            # http://localhost:4200 (el backend debe estar en http://localhost:8080)
npm test             # pruebas unitarias (Karma + Jasmine)
npm run build        # build de producción en dist/
```

La URL del backend y el client id de Google están en `src/environments/environment*.ts`.
El backend solo acepta CORS desde `http://localhost:4200` (`SecurityConfig.corsConfigurationSource`).

## Estructura

```
src/app/
├─ core/                 Infraestructura transversal (sin UI)
│  ├─ api/               Un cliente por controlador REST del backend
│  ├─ auth/              Sesión (signals), guards, interceptor JWT, Google Identity
│  ├─ http/              ApiError, interceptor de errores, contextos HTTP, multipart
│  ├─ files/             Descargas autenticadas (Blob + Content-Disposition)
│  ├─ models/            Tipos que reflejan los DTO del backend
│  ├─ notifications/     Avisos (MatSnackBar)
│  └─ i18n/              Paginador en español, títulos de pestaña
├─ shared/               Componentes, diálogos, pipes y validadores reutilizables
├─ layout/shell/         Barra superior + menú lateral por rol
└─ features/             Una carpeta por caso de uso (todas con lazy loading)
   ├─ auth/              Login (usuario/contraseña y Google) y registro
   ├─ home/              Inicio por rol
   ├─ catalog/           Catálogo y ejecución de transformaciones
   ├─ executions/        Historial, detalle, descargas y vista del código generado
   ├─ metamodels/        Metamodelos Ecore
   ├─ atl-modules/       Módulos ATL
   ├─ acceleo-modules/   Plantillas Acceleo
   ├─ transformations/   Definición y publicación del catálogo
   ├─ workspace/         Compilar y probar ATL/Acceleo sin registrar
   ├─ users/             Usuarios y roles (ADMIN)
   └─ account/           Mi cuenta
```

## Roles (replican `SecurityConfig`)

| Sección | USER | MODEL_ENGINEER | ADMIN |
| --- | :-: | :-: | :-: |
| Inicio, catálogo, ejecutar, historial propio | ✓ | ✓ | ✓ |
| Historial de todos los usuarios | | | ✓ |
| Metamodelos, ATL, Acceleo, transformaciones, espacio de trabajo | | ✓ | ✓ |
| Publicar / retirar transformaciones | | | ✓ |
| Usuarios y roles | | | ✓ |

Los guards solo mejoran la usabilidad: el backend valida cada petición.

## Convenciones

- Código en inglés, textos de interfaz en español.
- Formularios con Reactive Forms; los validadores replican las anotaciones `@NotBlank`, `@Size`
  y `requireExtension` del backend para avisar antes de enviar.
- Los errores HTTP se normalizan en `core/http/error.interceptor.ts`. Una petición que muestra
  sus errores en la propia pantalla usa `silentErrors()` para no duplicar el aviso.

El análisis completo y el detalle de los cambios están en
[docs/informe-frontend-muisca.md](docs/informe-frontend-muisca.md).

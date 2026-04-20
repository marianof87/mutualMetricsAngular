# Arquitectura

Resumen de las decisiones técnicas del proyecto. Si hacés un cambio que afecte a estas decisiones, documentalo como ADR en `docs/adr/`.

---

## 1. Estructura: monorepo

```
mutualMetricsAngular/
├── apps/
│   ├── frontend/        # Angular 21 SSR
│   └── backend/         # NestJS 11
├── packages/
│   └── shared/          # Tipos y schemas compartidos (Zod)
├── contracts/           # OpenAPI 3
├── e2e/                 # Tests Playwright
├── docker/
├── docs/
└── docker-compose.yml
```

Usamos **npm workspaces** para que `packages/shared` se consuma por referencia desde `apps/frontend` y `apps/backend` sin necesidad de publicar.

---

## 2. Frontend — Angular 21

- Componentes **standalone**.
- **Rutas lazy-load** en `app.routes.ts` — cada feature en su propio chunk.
- **Signals + Reactive Forms**.
- **Interceptor global** `core/interceptores/errores.interceptor.ts` normaliza los errores al `EnvelopeError`.

### Diseño visual — Design tokens + cascada CSS

- **Tokens** en `src/styles/tokens.css` (variables `--mm-*`).
- **Base** en `src/styles/base.css` (reset + elementos).
- **Utilidades** en `src/styles/utilidades.css` (`.contenedor`, `.panel-vidrio`, etc.).
- Todo se importa desde `styles.css`.
- **Regla:** los componentes no definen colores/espaciados/tipos hardcodeados; siempre referencian `var(--mm-*)`.

### Separación

```
src/app/
├── core/           # servicios globales, interceptores, config (zona compartida)
├── shared/         # componentes reutilizables (zona compartida)
├── features/       # ← UNA carpeta por integrante, aislada
└── app.*           # root (zona compartida)
```

---

## 3. Backend — NestJS 11

- Prefijo global `api/v1` (ver `main.ts`).
- `FiltroExcepcionesGlobal` captura **todo** (incluidas `ZodError` y `HttpException`) y devuelve el envelope.
- `ZodValidationPipe` valida body/query contra schemas de `@mutual-metrics/shared`.
- CORS por env var `CORS_ORIGIN`.

### Módulos globales

- `PersistenciaModule` → expone `PrismaService` (inyectable en cualquier service).
- `MediaModule` → expone `BlobService` (Vercel Blob, inyectable).

### Separación

```
src/
├── main.ts
├── app.module.ts            # registra todos los módulos (zona compartida)
├── comunes/                 # zona compartida
│   ├── filtros/
│   ├── pipes/
│   ├── persistencia/        # PrismaService
│   └── media/               # BlobService
└── modules/
    ├── inicio/ | sobre-nosotros/ | servicios/ | novedades/ | contacto/
```

---

## 4. Persistencia — SQLite + Prisma

- **SQLite file-based**, archivo `apps/backend/prisma/mutualmetrics.db` (ignorado por git — cada dev genera el suyo corriendo migraciones).
- Schema único en `apps/backend/prisma/schema.prisma`.
- **Migraciones se committean** (`apps/backend/prisma/migrations/`).
- Cliente singleton vía `PrismaService` (`comunes/persistencia/`).

### Flujo para agregar/modificar un modelo

```bash
# 1) Editar prisma/schema.prisma
# 2) Generar migración
npm run prisma:migrate -- --name <descripcion-corta>
# 3) El cliente se regenera solo; commitear schema + migrations/
```

---

## 5. Media — Vercel Blob

- Archivos (imágenes/videos de Novedades+Galería) se suben a **Vercel Blob**.
- Cliente vía `BlobService` (`comunes/media/blob.service.ts`).
- Requiere env var `BLOB_READ_WRITE_TOKEN` (ver `.env.example`). Se obtiene creando un Blob store en Vercel.
- En tests → mockear `BlobService`; nunca pegarle a la red real.

---

## 6. Contrato y tipos compartidos

Paquete: `@mutual-metrics/shared`.

- **Schemas Zod** en `src/dtos/<seccion>.ts` — fuente de verdad.
- **Envelope de error** tipado en `src/errores/envelope.ts`.
- **Enum `CodigoError`** en `src/errores/codigos.ts`.
- **Paginación estándar** en `src/dtos/paginacion.ts`: `?page=1&tamano=20` → `Paginado<T> = { datos, total, pagina, tamano }`.

`contracts/openapi.yaml` describe el contrato HTTP. **Debe estar alineado** con los DTOs de `packages/shared`.

---

## 7. Errores — envelope único

```json
{
  "error": {
    "code": "CODIGO_EN_MAYUSCULAS",
    "message": "Mensaje legible",
    "details": {},
    "traceId": "opcional"
  }
}
```

- Backend: `FiltroExcepcionesGlobal` mapea todo a este formato.
- Frontend: `erroresInterceptor` parsea y propaga `EnvelopeError` tipado.
- Catálogo: `docs/CODIGOS_ERROR.md`.

---

## 8. Testing — TDD con cobertura 95%

**Metodología:** test-driven. Primero el test, después la implementación.

**Stack:**
| Capa | Tool | Ubicación |
|---|---|---|
| Unit FE | Vitest + Angular testing | `*.spec.ts` junto al archivo |
| Unit BE | Jest + `@nestjs/testing` | `*.spec.ts` junto al archivo |
| Unit shared | Vitest | `*.test.ts` junto al archivo |
| Integration BE | Jest + supertest | `*.spec.ts` (mismo runner) |
| E2E | Playwright | `e2e/tests/*.spec.ts` |

**Meta de cobertura:** 95% en branches, functions, lines, statements.

Los configs (`vitest.config.ts`, `jest.coverageThreshold`) tienen el threshold documentado, pero el **enforce está diferido** hasta que cada sección tenga TDD real — con sólo stubs el 95% no aplica. Al implementar tu sección:
1. Escribir tests con TDD.
2. Activar el threshold en el scope de tu sección (editar `collectCoverageFrom`/`include` para sumar tus archivos).
3. Mantenerlo verde.

E2E **no** cuentan para el threshold — sólo validan flows reales.

**Responsabilidad cross-cutting:** Gabriel (@Nubiru) revisa y suma behavior tests sobre las secciones de los compañeros para asegurar que se llega al 95%.

**Comandos:**
```bash
npm test              # unit de los 3 workspaces
npm run test:cov      # con cobertura + thresholds
npm run test:e2e      # Playwright (arranca FE+BE automáticamente)
```

---

## 9. Contenedores

- Un `Dockerfile` por app (`docker/`).
- Multi-stage Node 20 alpine.
- `docker-compose.yml` compatible con `podman compose`.

---

## 10. CI

GitHub Actions (`.github/workflows/ci.yml`):
- Trigger: PRs y push a `main`.
- Jobs: instalar, lint, test + coverage, build-frontend, build-backend, e2e.
- CI rojo → no se puede mergear.

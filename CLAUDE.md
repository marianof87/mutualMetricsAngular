# CLAUDE.md — Reglas de trabajo IA + humano en MutualMetrics

Este archivo es la guía canónica para **cualquier agente de IA** (Claude Code u otro) que asista en este repositorio. Es intencionalmente **corto, en imperativo, y con rutas absolutas** para que la IA pueda aplicarlo sin ambigüedad y el humano lo pueda verificar de un vistazo.

> Complementa (no reemplaza) a [`GUIA.md`](./GUIA.md). Si hay conflicto: **GUIA.md gana** para decisiones de proceso, **CLAUDE.md gana** para reglas operativas al codear.

---

## 0. Contexto del proyecto

- Proyecto universitario grupal (5 estudiantes).
- Monorepo: `apps/frontend/` (Angular 21 SSR), `apps/backend/` (NestJS), `packages/shared/` (tipos + schemas Zod + códigos de error), `contracts/openapi.yaml`.
- **Cada integrante trabaja con IA**: cuando edites código, asumí que otro humano-con-IA lee lo que generaste. Escribí código y mensajes que cualquiera del equipo pueda entender sin preguntar.

---

## 1. Idioma

- **Todo lo que se agrega al repo va en español**: código (identificadores), comentarios, nombres de archivos, documentación, mensajes de commit, títulos de PR, issues, tests.
- Excepciones permitidas: keywords del lenguaje/framework, nombres de paquetes npm, convenciones estándar de Git (`main`, `HEAD`), códigos HTTP, términos técnicos sin traducción natural (ej: "endpoint", "hash", "stack trace").
- Si dudás entre traducir o no un término, **mantené el que usaría la industria hispana** — no inventes traducciones.

---

## 2. Propiedad de carpetas — 5 slices verticales

El proyecto está dividido en 5 slices. Cada slice tiene un dueño end-to-end (FE + BE + shared + DB + tests). Detalle completo en [`GUIA.md §1`](./GUIA.md).

### Dueños de slice

| Slice | Handle | Carpetas propias |
|---|---|---|
| 1 — Auth & Usuarios | @Nubiru | `features/auth/**`, `modules/auth/**`, `modules/usuarios/**` |
| 2 — Cuadrática | @marianof87 | `features/cuadratica/**`, `modules/cuadratica/**`, `dominio/cuadratica/**` |
| 3 — Pricing | @Monzon1983 | `features/pricing/**`, `modules/pricing/**`, `dominio/pricing/**` |
| 4 — Historial | @Franco1212 | `features/historial/**`, `modules/escenarios/**` |
| 5 — Público & Contacto | @Ange1809 | `features/{inicio,sobre-nosotros,servicios,novedades,contacto}/**`, `modules/novedades/**`, `modules/contacto/**` |

**Regla:** NO editar la carpeta de otro slice sin que el usuario lo pida explícitamente. Si el cambio lo requiere, proponelo al usuario y esperá confirmación.

### Zonas compartidas

Estas rutas las tocamos todos. **No requieren aprobación extra** — basta con 1 review estándar. Pero avisá al usuario cuando las tocás:

- `packages/shared/**`
- `contracts/**`
- `apps/frontend/src/app/core/**`
- `apps/frontend/src/app/shared/**`
- `apps/frontend/src/app/app.routes.ts`
- `apps/frontend/src/app/app.config.ts`
- `apps/frontend/src/styles/**`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/comunes/**`
- `apps/backend/prisma/**`
- `docker-compose.yml`, `docker/**`
- `.github/**`
- `package.json` (raíz)
- `README.md`, `GUIA.md`, `CLAUDE.md`, `docs/**`

---

## 3. Invariantes técnicas (NO romper)

### 3.1 Errores — envelope único

- **TODA respuesta de error del backend** usa el tipo `EnvelopeError` de `@mutual-metrics/shared`. El `FiltroExcepcionesGlobal` (`apps/backend/src/comunes/filtros/filtro-excepciones.filtro.ts`) se encarga — no lo bypassees.
- **NUNCA** lances `throw new Error('...')` crudo en el backend. Usá `HttpException` de Nest con `{ code, message, details? }` o dejá que `ZodValidationPipe` valide el body.
- En el frontend, los errores HTTP llegan ya normalizados vía `erroresInterceptor` (`apps/frontend/src/app/core/interceptores/errores.interceptor.ts`). **No parsear errores a mano.**

### 3.2 Tipos y schemas — una sola fuente de verdad

- Todo DTO request/response debe tener su schema Zod en `packages/shared/src/dtos/<seccion>.ts`.
- El tipo TypeScript se infiere con `z.infer<typeof XxxSchema>` — **no duplicar el tipo a mano**.
- Frontend y backend importan el mismo schema. Si cambia, cambia en un solo lugar.

### 3.3 Códigos de error

- Agregar códigos **siempre** en `packages/shared/src/errores/codigos.ts` **y** documentarlos en `docs/CODIGOS_ERROR.md` en el **mismo commit**.
- Códigos específicos de sección llevan prefijo: `CONTACTO_*`, `NOVEDADES_*`, etc.

### 3.4 Contrato API

- Si agregás o modificás un endpoint: actualizar `contracts/openapi.yaml` en el mismo PR.
- Prefijo global: `/api/v1`. Recursos en plural y en español (`/contactos`, `/novedades`).

### 3.5 Rutas del frontend

- Cada feature se registra en `apps/frontend/src/app/app.routes.ts` con **lazy-loading** (`loadComponent`).
- Esto es zona compartida — tocalo sólo cuando agregues una ruta nueva y avisá al usuario.

### 3.6 Persistencia (Prisma + SQLite)

- Schema único: `apps/backend/prisma/schema.prisma`.
- Inyectar `PrismaService` (ya es global): `constructor(private prisma: PrismaService) {}`.
- Tras agregar/modificar un modelo → `npm run prisma:migrate -- --name <desc>` → commitear `schema.prisma` + `migrations/`.
- **Nunca** editar SQL de una migración ya aplicada a main.

### 3.7 Media (imágenes/videos)

- MVP: usar URLs externas (links a imágenes hosteadas en otro lado).
- Si una sección necesita upload real al servidor, discutirlo primero — abre decisión cross-cutting.

### 3.8 Paginación

- Endpoints que listan usan `?page=1&tamano=20` → respuesta `Paginado<T>` (`{ datos, total, pagina, tamano }`).
- Parsear params con `ParametrosPaginacionSchema` de `@mutual-metrics/shared`.

### 3.9 Estilos — design tokens

- Los componentes usan variables `var(--mm-*)` definidas en `apps/frontend/src/styles/tokens.css`.
- **Nunca** hardcodear colores, espaciados o tipos en CSS de componente.
- Si necesitás un token nuevo: agregalo a `tokens.css` primero, después usalo.
- Ver `docs/ESTILOS.md` para el catálogo completo.

---

## 4. Estilo de código

- **No comentarios redundantes.** Los identificadores bien nombrados explican el *qué*. Comentá sólo el *por qué* cuando no sea obvio (una restricción, una decisión, un workaround).
- **No** dejes `console.log`/`console.error` en código committeado. Usá `Logger` de Nest en el backend.
- **No** hardcodees URLs. Frontend usa `entorno.apiBaseUrl` (`apps/frontend/src/app/core/configuracion/entorno.ts`). Backend usa env vars (`PORT`, `CORS_ORIGIN`, `DATABASE_URL`).
- **No** introduzcas dependencias nuevas sin razón fuerte. Proponé la dep al usuario antes de instalarla.

---

## 4.5 Testing — TDD con cobertura 80% (invariante)

- **Test-first.** Escribir el test que falla, después implementar. Aplica a lógica de dominio, pipes, services y componentes con lógica.
- **Threshold global:** 80% en branches, functions, lines, statements. Configurado en `vitest.config.ts` (shared) y `jest.coverageThreshold` (backend). El enforce arranca comentado hasta que haya código real por slice.
- **Capas:**
  - Unit: junto al archivo (`*.spec.ts` o `*.test.ts`).
  - Integration backend: `*.spec.ts` con `@nestjs/testing` + `supertest`.
- **Nunca** borrar un test ajeno "porque falla" sin acordarlo en el PR.
- El dueño del slice escribe el unit mínimo; Gabriel (@Nubiru) suma behavior tests cross-cutting para asegurar el 80%.

---

## 5. Commits y PRs

- Formato de commit: **Conventional Commits en español**. Ver `.claude/COMMIT.md` (local) para plantilla y ejemplos.
- Al hacer commits con asistencia de Claude: agregar footer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **NUNCA** usar `--no-verify`, `--force` a `main`, o commitear directo a `main`.
- Rama por tarea: `feature/<slice>/<descripcion>`, `fix/<slice>/<descripcion>`, `docs/<descripcion>`, `chore/<descripcion>`.
- PR chico (<500 líneas). Squash-merge a `main`.
- CI verde + **1 aprobación** antes de merge. **No hay regla de 2 aprobaciones** — todos tocamos el sistema horizontalmente (ver GUIA.md §2).

---

## 6. Trabajando con IA — principios para este repo

Como todo el equipo colabora con IA, las instrucciones que dejamos escritas tienen que ser **IA-amigables y humano-amigables a la vez**:

1. **Rutas absolutas, no descripciones.** "Editar `packages/shared/src/errores/codigos.ts`" > "editar el archivo de códigos".
2. **Reglas en imperativo.** "Nunca X", "Siempre Y". Evitar "se recomienda", "idealmente".
3. **Ejemplos antes que teoría.** Si una regla es sutil, mostrar un snippet.
4. **Invariantes al frente.** Las reglas que no pueden romperse van primero. Las preferencias, después.
5. **Un archivo = un propósito.** `CLAUDE.md` = reglas operativas. `GUIA.md` = proceso de equipo. `docs/ARQUITECTURA.md` = decisiones técnicas. `docs/CODIGOS_ERROR.md` = catálogo. No mezclar.
6. **Cross-references explícitas.** Si una regla depende de otra, linkear el archivo destino con ruta relativa.

---

## 7. Qué hacer ante dudas

- Si no tenés claro si un cambio toca zona compartida → **preguntar al usuario**.
- Si una operación es destructiva (borrar archivos, `git reset --hard`, `--force`) → **pedir confirmación explícita**.
- Si una dependencia nueva parece necesaria → **proponerla primero**, no instalarla.
- Si el alcance del pedido no está claro → **preguntar**, no asumir.

---

## 8. Dependencias y seguridad

- El repo se mantiene con **0 vulnerabilidades** (`npm audit` limpio) al mergear a `main`.
- Si `npm install` reporta vulnerabilidades nuevas:
  1. Correr `npm audit` y leer las advisories.
  2. Probar `npm audit fix` primero (no-breaking).
  3. Si quedan, evaluar bump de versión mayor (ej: Nest 11 → 12). **Avisar al usuario** antes de un bump mayor.
  4. **Nunca** correr `npm audit fix --force` sin pedir confirmación — puede romper el build.
- **Nunca** agregar una dependencia sin proponerla al usuario.
- Preferir deps que ya están en el repo (zod, rxjs, etc.) antes de introducir una nueva.

---

## 9. Archivos canónicos (referencia rápida)

| Para | Mirá |
|---|---|
| Cómo arrancar el proyecto | [`README.md`](./README.md) |
| Flujo de equipo, asignación, reglas de PR | [`GUIA.md`](./GUIA.md) |
| Decisiones técnicas, estructura, boundaries | [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) |
| Catálogo de códigos de error | [`docs/CODIGOS_ERROR.md`](./docs/CODIGOS_ERROR.md) |
| Checklist de contribución | [`docs/GUIA_CONTRIBUCION.md`](./docs/GUIA_CONTRIBUCION.md) |
| Contrato API (fuente de verdad) | [`contracts/openapi.yaml`](./contracts/openapi.yaml) |
| Tipos/schemas compartidos | [`packages/shared/src/`](./packages/shared/src/) |
| Feature/módulo de referencia end-to-end | `apps/frontend/src/app/features/contacto/` + `apps/backend/src/modules/contacto/` |
| Template de commit (local) | `.claude/COMMIT.md` |

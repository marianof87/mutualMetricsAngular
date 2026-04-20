# MutualMetrics

Proyecto académico desarrollado en grupo. Sitio web con 5 secciones (Inicio, Sobre nosotros, Servicios, Novedades y Contacto) construido como **monorepo** con frontend en **Angular** y backend en **NestJS**.

---

## Estructura del repo

```
mutualMetricsAngular/
├── apps/
│   ├── frontend/      # Angular 21 (SPA)
│   └── backend/       # NestJS 11
├── packages/
│   └── shared/        # Tipos, schemas (Zod) y códigos de error compartidos
├── contracts/         # openapi.yaml + ejemplos de request/response
├── docker/            # Dockerfiles + nginx.conf
├── docs/              # Documentación técnica (arquitectura, estilos, códigos de error, ADR)
├── docker-compose.yml
└── GUIA.md            # Guía interna para los 5 integrantes del equipo
```

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 (SPA) + design tokens CSS |
| Backend | NestJS 11 (TypeScript) |
| Persistencia | Prisma + SQLite |
| Tipos/schemas compartidos | `@mutual-metrics/shared` (Zod) |
| Contrato API | OpenAPI 3.0 (`contracts/openapi.yaml`) |
| Contenedores | Docker / Podman (mismo compose) |
| CI | GitHub Actions |

## Prerrequisitos

- **Node.js 20+** y **npm 11+**
- Opcional: **Docker** *o* **Podman** (si se quiere correr en contenedores)

## Arranque rápido (sin contenedores)

```bash
# 1) Instalar dependencias de todo el monorepo
npm install

# 2) Compilar el paquete compartido (sólo la primera vez o tras cambios en packages/shared)
npm run build:shared

# 3) Levantar frontend + backend en paralelo
npm run dev
```

- Frontend: http://localhost:4200
- Backend: http://localhost:3000/api/v1

## Arranque con contenedores

```bash
docker compose up --build
# o equivalente:
podman compose up --build
```

- Frontend (nginx): http://localhost:8080
- Backend: http://localhost:3000/api/v1

## Scripts útiles (en la raíz)

```bash
npm run dev              # FE + BE en paralelo (desarrollo)
npm run build            # Build de shared, backend y frontend
npm test                 # Tests de todos los workspaces
npm run lint             # Lint de todos los workspaces
npm run docker:up        # docker compose up --build
npm run podman:up        # podman compose up --build
```

## Integrantes y slices

Trabajamos en **5 slices verticales** (frontend + backend + shared + DB + tests). Las 5 páginas del profesor viven dentro del Slice 5.

| Slice | Integrante | GitHub |
|---|---|---|
| 1 — Auth & Usuarios 🔐 | Gabriel Osemberg | [@Nubiru](https://github.com/Nubiru) |
| 2 — Calculadora Cuadrática 📐 | Mariano Capella | [@marianof87](https://github.com/marianof87) |
| 3 — Optimizador de Precios 💰 | Mauro Sebastian Monzon | [@Monzon1983](https://github.com/Monzon1983) |
| 4 — Historial & Escenarios 📊 | Franco Marquez | [@Franco1212](https://github.com/Franco1212) |
| 5 — Contenido Público & Contacto 🌐 | Angelica Morales | [@Ange1809](https://github.com/Ange1809) |

> Detalle completo de cada slice: [`GUIA.md` §1](./GUIA.md).

## ¿Trabajás en este proyecto?

Leé [`GUIA.md`](./GUIA.md) — contiene la asignación por secciones, flujo de ramas/PRs, convenciones y referencias a los esquemas compartidos. **Todo lo que necesitás saber antes de pushear tu primer commit.**

Documentación técnica adicional:

- [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) — decisiones de diseño
- [`docs/CODIGOS_ERROR.md`](./docs/CODIGOS_ERROR.md) — catálogo de códigos
- [`docs/GUIA_CONTRIBUCION.md`](./docs/GUIA_CONTRIBUCION.md) — flujo de PRs
- [`contracts/openapi.yaml`](./contracts/openapi.yaml) — contrato API

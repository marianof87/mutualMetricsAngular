# Plan de lanzamiento v1 — MutualMetrics (Metrix AI)

> Fuente: auditoría completa del 2026-08-30 (código, tests, contrato, docs, CI/CD, seguridad).
> Este plan es **canónico**: lo confirma únicamente la persona responsable del repo (no el equipo).
> Cada tarea es **atómica**: tiene criterios de aceptación (AC) verificables y se cierra en un solo PR
> salvo que se indique lo contrario. Formato de commit: Conventional Commits en español (ver CLAUDE.md §5).

---

## Objetivo

Lanzar una **primera versión (v1)** del producto que:

1. Arranque con `docker compose up` sin errores y sirva FE + BE de punta a punta.
2. Tenga los 5 slices funcionales end-to-end (FE + BE + shared + DB + tests).
3. Cumpla las invariantes de `CLAUDE.md` (envelope, Zod compartido, openapi en sync, 0 vulnerabilidades).
4. Pase CI con cobertura ≥ 80% medida **sobre todo el repo** (hoy solo mide un subconjunto).

---

## Decisiones que REQUIEREN confirmación del usuario

| ID | Decisión | Por qué bloquea | Status |
|---|---|---|---|
| D1 | Bump de Angular 21.0.x → 21.2.22+ (bump mayor, puede romper build) | `npm audit` reporta 39 vulns (2 críticas, 29 altas) en `@angular/*`, `vite` | Pendiente |
| D2 | Contrato canónico de pricing: unificar en `/pricing/optimizar` (openapi) o en `/optimizador/calcular` (código real) | Hay dos mundos paralelos; hay que elegir uno antes de Fase 1 | Pendiente |
| D3 | Alcance de v1: ¿integración de pagos real o solo pantalla informativa de pricing? | Slice 3 no tiene ningún plan/checkout | Pendiente |
| D4 | ¿Backup/migración de base a Postgres o seguir con SQLite + volumen? | SQLite es efímera en contenedor sin volumen (Fase 3) | Pendiente |

---

## Fase 0 — Sanear (blockers de operación)

> Objetivo: repo verde, sin vulnerabilidades accionables, y `docker compose up` funcionando.

| ID | Tarea atómica | AC (Definition of Done) | Esfuerzo |
|---|---|---|---|
| T0.1 | ✅ Commitear cambios pendientes del working tree (feature Beta-PERT) | Commits descriptivos; tests verdes antes de commit | 0.5 h |
| T0.2 | ✅ `npm audit fix` (no-breaking) y documentar vulns restantes | `npm audit` sin fixes no-breaking disponibles; lista de restantes con severidad | 0.5 h |
| T0.3 | ✅ Bump Angular a 21.2.22+ (tras D1) | `npm audit` con 0 high/critical en producción; build FE + tests verdes | 2-4 h |
| T0.4 | ✅ Inyectar `DATABASE_URL` y `JWT_SECRET` al servicio `backend` de docker-compose | `docker compose up` levanta backend sin crash de `$connect()` | 0.5 h |
| T0.5 | ✅ Estrategia API URL de producción: proxy `/api/` en nginx + default same-origin (o inyección de `__MUTUAL_METRICS_CONFIG__`) | FE en prod consume `/api/v1` a través de nginx, no `localhost:3000` | 1-2 h |
| T0.6 | Verificar `docker compose up` end-to-end | FE sirve en :8080, BE responde en :3000, `/api` proxy responde, persistencia OK | 1 h |

## Fase 1 — Cerrar slices pendientes

> Objetivo: los 5 slices end-to-end. Orden sugerido: 4 → 2 → 3.

| ID | Tarea atómica | AC (Definition of Done) | Slice | Esfuerzo |
|---|---|---|---|---|
| T1.1 | Modelo Prisma `Escenario` + migración | Modelo con FK a `Usuario`; migración commiteada; `schema.prisma` + `migrations/` en el PR | 4 | 1 h |
| T1.2 | DTOs shared de escenarios (`dtos/escenarios.ts`) + códigos `ESCENARIOS_*` | Schemas Zod + tipo inferido; códigos en `codigos.ts` y `CODIGOS_ERROR.md` en el mismo PR | 4 | 2 h |
| T1.3 | CRUD backend `/escenarios` (GET paginado, GET/:id, POST, DELETE) con JWT | Endpoints reales con `ZodValidationPipe` + `JwtAuthGuard`; response `Paginado<Escenario>`; alineados con openapi | 4 | 4 h |
| T1.4 | FE historial: tabla paginada + filtro por tipo + detalle + re-ejecutar + borrar | Ruta `/historial` protegida con `authGuard`; componente con tests; datos del backend | 4 | 6 h |
| T1.5 | Dominio puro cuadrática (`packages/shared/src/dominio/cuadratica/`) + DTOs (`dtos/cuadratica.ts`) | Funciones puras resolución + tests; schemas Zod compartidos | 2 | 3 h |
| T1.6 | Endpoint `POST /cuadratica/resolver` real (reemplaza `/ping`) | Valida con Zod; usa dominio compartido; error `CUADRATICA_A_CERO`; alineado con openapi | 2 | 2 h |
| T1.7 | FE cuadrática: conectar al backend + design tokens + tests | Componente llama al API; CSS sin colores hardcodeados (regla 3.9); spec | 2 | 3 h |
| T1.8 | Decidir D2 y unificar pricing (`/pricing/optimizar` + `/break-even` reales, o renombrar `/optimizador`) | Un solo contrato canónico; `dominio/precios` reutilizado; endpoint fuera de contrato eliminado o documentado | 3 | 4 h |
| T1.9 | FE pricing: eliminar stub hardcodeado; conectar al backend real | Componente sin `console.log`, sin `any`, sin datos falsos; spec | 3 | 3 h |
| T1.10 | FE novedades: consumir `GET /novedades` + vista de detalle (BE `GET /:id`) | Tarjetas desde backend; botones "Leer más" funcionales; media con URLs externas (regla 3.7) | 5 | 4 h |

> **Hallazgo Fase 0 (budget):** el bundle inicial de producción pesa 582 kB (warning; límite warning 500 kB, límite error 1 MB). Causa probable: `chart.js`+`ng2-charts` en el main bundle. No rompe el build; en Fase 1/3 evaluar lazy-load de chart.js o subir el budget con criterio.

## Fase 2 — Consistencia y calidad

> Objetivo: contrato en sync, cobertura real, docs sin contradicciones.

| ID | Tarea atómica | AC (Definition of Done) | Esfuerzo |
|---|---|---|---|
| T2.1 | Sincronizar `contracts/openapi.yaml` con el código | Endpoints que existen documentados (incl. `/optimizador/calcular` si sobrevive a D2); endpoints no implementados marcados o eliminados; status codes correctos (finanzas 200 vs 201) | 3 h |
| T2.2 | Ampliar `collectCoverageFrom` de Jest a todos los módulos backend | Cobertura medida sobre los 11 módulos; umbrales 80% se cumplen (o se agregan tests) | 4 h |
| T2.3 | Cobertura FE en CI + thresholds 80% | `test:cov` incluye frontend; CI falla si baja de 80% | 3 h |
| T2.4 | Tests unitarios faltantes (backend: cuadratica, pricing, escenarios, novedades, optimizador, finanzas; FE: 10 features) | Specs para cada módulo/feature sin test según matriz de Testing | 8 h |
| T2.5 | Arreglar script `test:e2e` (crear `apps/backend/test/jest-e2e.json` + al menos 1 smoke test e2e) | Script corre sin error; smoke test de `/actuarial/simulaciones` o `/contactos` | 2 h |
| T2.6 | Corregir violaciones CLAUDE.md en slices 2/3 (colores hardcodeados, `console.log`, URL hardcodeada, `BadRequestException` sin envelope, finanzas sin pipe Zod) | Código cumple invariantes 3.1/3.9 y regla 4 | 3 h |
| T2.7 | Crear `.claude/COMMIT.md` con template de commit | CLAUDE.md §5 ya no referencia un archivo inexistente | 0.5 h |
| T2.8 | Resolver contradicciones de docs (cobertura 95 vs 80, aprobaciones 1 vs 2, mapa de slices, `dominio/pricing` vs `dominio/precios`, READMEs desactualizados) | Docs referencian archivos que existen y valores reales | 2 h |
| T2.9 | Exportar `DistribucionResumenSchema` (bug de export) + subpath `./dominio` en shared | Importación directa posible; sin errores de tipos | 0.5 h |

## Fase 3 — Deploy

> Objetivo: v1 desplegable en un entorno real.

| ID | Tarea atómica | AC (Definition of Done) | Esfuerzo |
|---|---|---|---|
| T3.1 | `prisma migrate deploy` en el flujo (CI/CD o entrypoint del contenedor) | Migraciones se aplican automáticamente en entorno target | 1 h |
| T3.2 | Volumen persistente para SQLite en compose (o migrar a Postgres según D4) | Datos sobreviven `docker compose down`/recreate | 1 h |
| T3.3 | CD: workflow de build + push de imágenes + release (o al menos `docker compose build` en CI) | Pipeline despliega o empaqueta la v1 | 3 h |
| T3.4 | Healthchecks en compose + límites de recursos | `docker compose ps` muestra healthy; sin OOM conocido | 1 h |
| T3.5 | Smoke test post-deploy (login + una simulación actuarial + contacto) | Script o paso que verifica el flujo crítico end-to-end | 2 h |

---

## Criterios de salida de v1 (Definition of Release)

- [ ] `npm audit` con 0 high/critical en dependencias de producción.
- [ ] `docker compose up` levanta FE + BE y el flujo crítico funciona (login → simulación → historial → contacto).
- [ ] Los 5 slices tienen FE + BE + shared + DB implementados y testeado.
- [ ] `contracts/openapi.yaml` coincide con los endpoints implementados (sin endpoints fantasma).
- [ ] CI pasa con cobertura ≥ 80% medida sobre todo el repo (FE + BE + shared) y TODOS los módulos.
- [ ] Ejecución de los 3 primeros items del checklist de `docs/GUIA_CONTRIBUCION.md` sin excepción.
- [ ] Docs canónicos (README, ARQUITECTURA, CLAUDE, GUIA) sin contradicciones ni referencias rotas.

---

## Registro de avance

| Fecha | Tarea | Resultado |
|---|---|---|
| 2026-08-30 | T0.1 | Commit `89c8047` — Beta-PERT feature commiteada (149 tests de shared verdes) |
| 2026-08-30 | T0.2 + T0.3 | Dependencias saneadas: Angular 21.2.22 (overrides en raíz + pin directo), Nest 11.2.3, árbol limpiado y hoisteado en una sola copia. Audit final: **3 high** (cadena `prisma` CLI, solo tooling dev) — 0 critical/low/moderate. Suite completa verde: shared 149, FE 47, BE 47. Build FE OK (warning budget: bundle inicial 582 kB > 500 kB límite warning — ver nota en Fase 1). `npm audit fix --force` NO aplicado (propone downgrade rompedor a prisma 6.12.0) |
| 2026-08-30 | T0.4 | `docker-compose.yml`: `DATABASE_URL` + `JWT_SECRET` inyectados con defaults override-ables via `.env`. `backend.Dockerfile`: `CMD` ahora ejecuta `prisma migrate deploy && node dist/main.js` |
| 2026-08-30 | T0.5 | `nginx.conf`: proxy `location /api/` → `backend:3000` + headers forwarding. `entorno.ts`: default same-origin `/api/v1`. Nuevo `apps/frontend/proxy.conf.json` + `angular.json` (`proxyConfig`) para dev. NOTA: si estabas corriendo `ng serve`, reiniciarlo para tomar el proxy |
| 2026-08-30 | T0.6 | ⏸ PENDIENTE — Docker no está instalado en la máquina local del usuario. Ejecutar `npm run docker:up` (requiere Docker Desktop) y verificar: FE :8080, BE :3000, `/api/v1` proxeado, persistencia OK |
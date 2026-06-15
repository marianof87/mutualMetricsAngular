# GUIA — Cómo trabajamos en MutualMetrics

Este documento es **interno del equipo**. Explica cómo dividimos el trabajo, cómo colaboramos en Git sin pisarnos, y qué esquemas/códigos/convenciones compartimos. Léelo **antes** de empezar a codear.

> Para saber *qué es* MutualMetrics y cómo arrancarlo, ver [`README.md`](./README.md).

---

## 1. División del trabajo — 5 slices verticales

**MutualMetrics como producto** es una herramienta web para resolver funciones cuadráticas y optimizar precios/ganancias. Las 5 páginas que pide la consigna (Inicio, Sobre nosotros, Servicios, Novedades, Contacto) son el **contenedor** del producto; el cerebro vive en los calculadores.

Dividimos en **5 slices verticales**. Cada integrante es dueño **end-to-end** de su slice: frontend + backend + schemas compartidos + modelo de DB + tests.

| # | Slice | Dueño | Qué incluye |
|---|---|---|---|
| 1 | **Auth & Usuarios** 🔐 | @Nubiru | Registro + login + JWT + guard + interceptor + perfil |
| 2 | **Calculadora Cuadrática** 📐 | @marianof87 | Resolver `ax² + bx + c`: discriminante, raíces, vértice, gráfico |
| 3 | **Optimizador de Precios** 💰 | @Monzon1983 | Modelado cuadrático de revenue/profit, vértices óptimos, break-even |
| 4 | **Historial & Escenarios** 📊 | @Franco1212 | Guardar cálculos por usuario, listar paginado, re-ejecutar |
| 5 | **Contenido Público & Contacto** 🌐 | @Ange1809 | Las 5 páginas teacher + blog/novedades + form de contacto |

### Cobertura de las 5 páginas del profesor

| Página | Dónde vive | Dueño |
|---|---|---|
| Inicio | `features/inicio/` | Slice 5 (@Ange1809) |
| Sobre nosotros | `features/sobre-nosotros/` | Slice 5 (@Ange1809) |
| Servicios | `features/servicios/` — landing que linkea a Cuadrática y Pricing | Slice 5 (@Ange1809) |
| Novedades | `features/novedades/` | Slice 5 (@Ange1809) |
| Contacto | `features/contacto/` (referencia ya implementada) | Slice 5 (@Ange1809) |

### Detalle de cada slice

Cada slice tiene su `README.md` en las carpetas propias con endpoints, schemas, modelos de DB y checklist. Acá está el resumen:

#### Slice 1 — Auth & Usuarios (@Nubiru)
- Frontend: `features/auth/login/`, `features/auth/registrar/`, interceptor JWT y guard de ruta en `core/`
- Backend: `modules/auth/` + `modules/usuarios/`
- Shared: `dtos/auth.ts` (RegistrarRequest, LoginRequest, SesionResponse), códigos `AUTH_*`
- DB: modelo `Usuario`
- **Cross-cutting:** desbloquea a Slice 4; todos los demás eventualmente consumen el JWT para proteger sus endpoints

#### Slice 2 — Calculadora Cuadrática (@marianof87)
- Frontend: `features/cuadratica/`
- Backend: `modules/cuadratica/`
- Shared: `dominio/cuadratica/` (funciones puras) + `dtos/cuadratica.ts`
- DB: sin modelo propio (stateless)

#### Slice 3 — Optimizador de Precios (@Monzon1983)
- Frontend: `features/pricing/`
- Backend: `modules/pricing/`
- Shared: `dominio/pricing/` (demanda, revenue, profit, optimizar, validar) + `dtos/pricing.ts`
- DB: sin modelo propio (stateless)
- **Referencia obligatoria:** `/home/gabiota/personal/projects/files/mutual-metrics/mi-proyecto/docs/MVP_Feature_Blueprint.md`

#### Slice 4 — Historial & Escenarios (@Franco1212)
- Frontend: `features/historial/`
- Backend: `modules/escenarios/`
- Shared: `dtos/escenarios.ts`, usa `Paginado<T>` ya existente
- DB: modelo `Escenario` con FK a `Usuario`
- **Dependencia:** Auth de Slice 1 para `usuarioId`. Podés empezar con mock.

#### Slice 5 — Contenido Público & Contacto (@Ange1809)
- Frontend: `features/inicio/`, `features/sobre-nosotros/`, `features/servicios/`, `features/novedades/`, `features/contacto/`
- Backend: `modules/novedades/` + `modules/contacto/` (ya implementado como referencia)
- Shared: `dtos/novedades.ts`, ya existe `dtos/contacto.ts`
- DB: modelos `Novedad` y `Contacto`

### Qué hacer como dueño de slice

1. Lee el `README.md` de tu carpeta (frontend + backend).
2. Escribe los schemas Zod en `packages/shared/` antes que cualquier otra cosa.
3. Escribe los tests antes que la implementación (TDD — ver §6).
4. Implementa el endpoint backend + el componente frontend + la integración.
5. Actualizá `contracts/openapi.yaml` en el mismo PR.
6. Actualizá `docs/CODIGOS_ERROR.md` si agregás códigos nuevos.

---

### Estado actual de los slices (al 2026-06-15)

Foto del avance real, leída del código en `main` y de las ramas WIP. **Slice 1 está terminado (DoD §7 completo); el resto sigue en curso.** Mantener esta tabla al día cuando se mergea trabajo.

| Slice | Dueño | Estado | Avance | Dónde vive |
|---|---|---|---|---|
| 1 — Auth & Usuarios | @Nubiru | ✅ Completo (FE + BE + tests) | 100% | Mergeado en `main` |
| 3 — Pricing | @Monzon1983 | En curso | ~40% | Mergeado en `main` |
| 5 — Público & Contacto | @Ange1809 | En curso | ~26% | Mergeado en `main` |
| 2 — Cuadrática | @marianof87 | En curso (solo FE) | ~35% | Rama `quad-solver` (sin mergear) |
| 4 — Historial | @Franco1212 | Sin arrancar (solo diseño) | ~10% | Rama `feature/historial/diseno-slice4` |

**Detalle por slice:**

- **Slice 3 (Pricing):** optimizador cuadrático funcional end-to-end (FE → controller/service NestJS → modelo Prisma `Optimizacion` + migración). Pendiente: se implementó bajo el nombre `optimizador` mientras las carpetas `pricing` quedaron como stub vacío; el contrato OpenAPI declara `/pricing/optimizar` pero el código sirve `/optimizador/calcular` (desalineado); faltan tests.
- **Slice 5 (Contacto/Novedades):** `contacto` es la referencia end-to-end (form reactivo → controller validado → modelo Prisma `Contacto`), **pero el service no persiste todavía** (TODO en su README). `novedades` tiene schema Zod + OpenAPI pero sin modelo Prisma ni wiring de FE. Páginas públicas (inicio/sobre-nosotros/servicios) son placeholders.
- **Slice 2 (Cuadrática):** componente frontend real en `quad-solver`, sin backend ni schema compartido ni integración HTTP aún. ⚠️ La rama incluye un archivo vacío `mutualMetricsAngular` en la raíz (commit accidental) — limpiar antes de mergear.
- **Slice 4 (Historial):** solo documento de diseño. **Desbloqueado:** el modelo `Usuario` y el `JwtAuthGuard` de Slice 1 ya están en `main`, así que `Escenario` (FK a `Usuario`) y la protección de endpoints se pueden implementar ya.
- **Slice 1 (Auth & Usuarios):** ✅ **Completo end-to-end.** Backend: `AuthService` (registrar/login con bcrypt + JWT), `modules/usuarios` (`GET/PATCH /usuarios/yo`), `JwtAuthGuard` reutilizable, modelo `Usuario` + migración. Frontend: `SesionService` (signal `usuarioActual()`), `jwt.interceptor`, `auth.guard`, formularios login/registrar, navbar con login/logout. Schemas Zod en `shared`, contrato OpenAPI alineado, códigos `AUTH_*` documentados, tests unit + integración en backend y frontend. (Refresh queda fuera del MVP por decisión, ver README del slice.)

---

## 2. Ramas y PRs

**Trunk-based simplificado** — una sola rama larga: `main`. Sin `develop`.

### Cómo nombrar ramas

```
feature/<slice>/<descripcion-corta-en-kebab-case>
fix/<slice>/<descripcion>
docs/<descripcion>
chore/<descripcion>
```

`<slice>` es uno de: `auth`, `cuadratica`, `pricing`, `historial`, `publico` (o el nombre de la página dentro de Slice 5: `novedades`, `contacto`, etc.).

Ejemplos:
```
feature/auth/login-backend
feature/cuadratica/dominio-puro
fix/pricing/validacion-k-negativa
docs/arquitectura-slices
```

### Flujo estándar

```bash
git checkout main
git pull
git checkout -b feature/auth/login-backend
# ... codeás, committeás
git push -u origin feature/auth/login-backend
# abrir PR en GitHub
```

### Reglas de PR

- **Un PR = un cambio acotado.** Mejor 3 PRs chicos que uno de 1000 líneas.
- **Commits en español**, Conventional Commits: `feat(<slice>):`, `fix(<slice>):`, `docs(<slice>):`, `chore:`, `test(<slice>):`.
- **CI verde** antes de pedir review.
- **1 aprobación** de cualquier otro integrante para mergear a `main`. **No hay regla de 2 aprobaciones** — todos tocamos el sistema entero horizontalmente, así que basta con que 1 par revise tu PR.
- **Squash-merge** a `main` (historial limpio).

---

## 3. Zonas de código — dueños y compartidas

### Dueños de slice (zonas propias)

Cada integrante tiene **full ownership** de estas rutas:

| Slice | Rutas propias |
|---|---|
| Slice 1 — @Nubiru | `features/auth/**`, `modules/auth/**`, `modules/usuarios/**` |
| Slice 2 — @marianof87 | `features/cuadratica/**`, `modules/cuadratica/**`, `dominio/cuadratica/**` en shared |
| Slice 3 — @Monzon1983 | `features/pricing/**`, `modules/pricing/**`, `dominio/pricing/**` en shared |
| Slice 4 — @Franco1212 | `features/historial/**`, `modules/escenarios/**` |
| Slice 5 — @Ange1809 | `features/{inicio,sobre-nosotros,servicios,novedades,contacto}/**`, `modules/novedades/**`, `modules/contacto/**` |

Respetá la carpeta de los demás — si necesitás algo de otro slice, pedilo en el grupo (probablemente falta un schema compartido o un endpoint).

### Zonas compartidas

Estas rutas las tocamos todos cuando corresponde. **No requieren aprobación extra** — basta con la regla estándar (1 review + CI verde). Pero sí avisá en el grupo cuando las tocás, para que nadie se sorprenda en un merge.

- `apps/frontend/src/app/app.routes.ts` — registro de rutas
- `apps/frontend/src/app/app.config.ts` — providers globales
- `apps/frontend/src/app/shared/**` — navbar, footer, componentes reutilizables
- `apps/frontend/src/app/core/**` — interceptores, guards, configuración
- `apps/frontend/src/styles/**` — design tokens y utilidades CSS
- `apps/backend/src/app.module.ts` — registro de módulos
- `apps/backend/src/comunes/**` — filtros, pipes, persistencia global
- `apps/backend/prisma/**` — schema + migraciones
- `packages/shared/**` — tipos, DTOs, códigos de error
- `contracts/openapi.yaml` — contrato API
- `docker-compose.yml`, `docker/**`, `.github/**` — infra y CI
- `package.json` raíz, `README.md`, `GUIA.md`, `CLAUDE.md`

---

## 4. Contrato y tipos compartidos (`@mutual-metrics/shared`)

Única fuente de verdad para:

- **Códigos de error** — `packages/shared/src/errores/codigos.ts`
- **Envelope de error** — `packages/shared/src/errores/envelope.ts`
- **DTOs / schemas Zod** — `packages/shared/src/dtos/<slice>.ts`
- **Dominio puro** (matemática) — `packages/shared/src/dominio/<slice>/`
- **Paginación estándar** — `packages/shared/src/dtos/paginacion.ts`

### Cómo importar

**Frontend:**
```ts
import { ContactoRequestSchema, CodigoError, EnvelopeError } from '@mutual-metrics/shared';
```

**Backend:**
```ts
import { ContactoRequestSchema, CodigoError } from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
```

### Agregar un DTO nuevo (tu slice)

1. Creá `packages/shared/src/dtos/<slice>.ts` con el schema Zod + tipo inferido.
2. Exportalo desde `packages/shared/src/dtos/index.ts`.
3. Correr `npm run build:shared`.
4. Usalo en frontend y backend.
5. Actualizá `contracts/openapi.yaml` con el endpoint.

### Agregar dominio puro (matemática de tu slice)

Los slices 2 y 3 tienen matemática que debe vivir en **shared** (no en el backend), porque el frontend también la puede usar para previews en vivo.

1. Creá `packages/shared/src/dominio/<slice>/` con funciones puras (sin `this`, sin clases, sin Angular/Nest).
2. Tests al lado (`*.test.ts`) con vitest.
3. Exportá desde `src/index.ts`.
4. Importá tanto desde el controller backend como desde el componente frontend.

### Persistencia (Prisma + SQLite)

1. Editar `apps/backend/prisma/schema.prisma` — agregar tu modelo.
2. `npm run prisma:migrate -- --name agrega-<cosa>`.
3. Commitear `schema.prisma` + `prisma/migrations/<timestamp>_.../`.
4. En tu service: `constructor(private prisma: PrismaService) {}` (ya global).

### Media (imágenes/videos)

MVP: URLs externas. Si tu slice necesita upload real al servidor, abrí la discusión en el grupo antes.

### Paginación — endpoints que listan

Convención: `?page=1&tamano=20` → respuesta `Paginado<T>`.

```ts
import { ParametrosPaginacionSchema, Paginado } from '@mutual-metrics/shared';

@Get()
listar(@Query(new ZodValidationPipe(ParametrosPaginacionSchema)) q: ParametrosPaginacion): Promise<Paginado<MiTipo>> {
  // ...
}
```

### Ejemplo completo de referencia

`features/contacto/` + `modules/contacto/` + `dtos/contacto.ts` son la implementación de referencia del patrón FE↔BE. Mirálo antes de empezar tu slice.

---

## 5. Errores — siempre con envelope

**Toda respuesta de error** del backend:

```json
{
  "error": {
    "code": "CODIGO_EN_MAYUSCULAS",
    "message": "Mensaje legible en español",
    "details": {},
    "traceId": "opcional"
  }
}
```

- En backend **no lances `throw new Error(...)` pelado**. Usá `HttpException` de NestJS con `{ code, message, details? }` o dejá que `ZodValidationPipe` convierta validaciones falladas en `ENTRADA_INVALIDA`. El `FiltroExcepcionesGlobal` le da la forma final.
- En frontend **no parsees errores a mano**. El `erroresInterceptor` ya te entrega un `EnvelopeError` tipado.
- **Nunca** mostrar un stack trace al usuario.

Catálogo: [`docs/CODIGOS_ERROR.md`](./docs/CODIGOS_ERROR.md).

---

## 6. Tests — TDD con cobertura 80%

**TDD:** escribir el test antes de la implementación.

**Meta de cobertura:** 80% en branches, functions, lines, statements.

El threshold está documentado en los configs pero el enforce arranca **comentado** (los stubs no lo alcanzan). Al implementar tu slice: activalo en tu scope y mantenelo verde.

### Capas

| Capa | Runner | Ubicación |
|---|---|---|
| Unit frontend | Vitest + Angular testing | `*.spec.ts` junto al archivo |
| Unit backend | Jest + `@nestjs/testing` | `*.spec.ts` junto al archivo |
| Unit shared | Vitest | `*.test.ts` junto al archivo |
| Integration backend | Jest + supertest | `*.spec.ts` |

### Responsabilidades

- **Cada dueño** escribe los tests mínimos de su slice siguiendo TDD.
- **@Nubiru** actúa como evaluador cross-cutting: revisa cobertura agregada y suma behavior tests faltantes cuando hace falta para llegar al 80%.

### Comandos

```bash
npm test              # unit en los 3 workspaces
npm run test:cov      # con coverage + thresholds (cuando estén activos, falla si <80%)
```

---

## 7. Definición de Terminado (DoD)

Un slice está **terminado** cuando:

- [ ] Código en frontend + backend + shared + (si aplica) DB
- [ ] Schemas Zod en `packages/shared`
- [ ] `contracts/openapi.yaml` actualizado con los endpoints
- [ ] Códigos de error documentados en `docs/CODIGOS_ERROR.md`
- [ ] Tests unit + integration pasando, cobertura ≥80% en tu scope
- [ ] CI verde
- [ ] PR con 1 aprobación de un compañero
- [ ] `README.md` de tu slice actualizado con el alcance real

---

## 8. Dependencias y auditoría (`npm audit`)

El ecosistema JS reporta seguido "vulnerabilidades" en deps transitivas de dev. El repo arrancó con **0 vulnerabilidades**. Si `npm install` muestra warnings:

```bash
npm audit              # leer advisories
npm audit fix          # arreglar no-breaking
# Si quedan cosas breaking — NO uses --force sin hablarlo con el grupo.
```

**Regla:** no committear `package-lock.json` con vulnerabilidades `high` o `critical`. Moderate en dev-only se toleran si están discutidas.

---

## 9. Comandos que usás todos los días

```bash
npm install                          # primera vez o tras cambios en deps
npm run dev                          # FE + BE en paralelo
npm run build:shared                 # tras tocar packages/shared
npm test                             # todos los tests
npm run prisma:migrate -- --name X   # nueva migración
npm run docker:up                    # probar con contenedores

git checkout -b feature/<slice>/<cosa>
git commit -m "feat(<slice>): ..."
git push -u origin HEAD
```

---

## 10. Dudas y decisiones

Si hay que decidir algo que afecta a todos (cambio en el contrato, códigos de error, estructura), **abrí un issue** o un PR de docs y etiquetá al grupo. No decidas solo sobre zonas compartidas.

Para decisiones arquitectónicas grandes usamos **ADRs** (Architectural Decision Records) en `docs/adr/`. Template en `docs/adr/0001-template.md`.

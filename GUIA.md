# GUIA — Cómo trabajamos en MutualMetrics

Este documento es **interno del equipo**. Explica cómo dividimos el trabajo, cómo colaboramos en Git sin pisarnos, y qué esquemas/códigos/convenciones compartimos. Léelo **antes** de empezar a codear.

> Para saber *qué es* MutualMetrics y cómo arrancarlo, ver [`README.md`](./README.md).

---

## 1. Somos 5, son 5 secciones

El sitio tiene 5 secciones (las 6 del enunciado, fusionando **Galería dentro de Novedades**). Cada integrante es **dueño total** de una sección: su feature en el frontend + su módulo en el backend + los tests.

| Integrante | GitHub | Sección |
|---|---|---|
| Angelica Morales | @Ange1809 | *por elegir* |
| Mauro Sebastian Monzon | @Monzon1983 | *por elegir* |
| Mariano Capella | @marianof87 | *por elegir* |
| Gabriel Osemberg | @Nubiru | **Contacto** (referencia) + infraestructura |
| Franco Marquez | @Franco1212 | *por elegir* |

### Cómo elegís tu sección

No hay asignación top-down. **El que llega primero elige.**

1. Mirá la lista de **Secciones disponibles** abajo.
2. Abrí un PR chico (una rama `chore/<tu-handle>/elige-seccion`) que:
   - Cambia *"por elegir"* por el nombre de la sección elegida en esta tabla.
   - Cambia *"Dueño: TBD"* por tu nombre en `apps/frontend/src/app/features/<seccion>/README.md` **y** en `apps/backend/src/modules/<seccion>/README.md`.
   - Descomenta las dos líneas de tu sección en `.github/CODEOWNERS` y pone tu handle.
3. Avisá en el grupo antes de mergear para evitar que dos tomen la misma.

### Secciones disponibles

- **Inicio** — presentación general, imagen destacada, navegación.
- **Sobre nosotros** — info del proyecto/escuela/equipo, objetivos, contexto.
- **Servicios** — qué ofrece el sistema (registro, consultas, reservas, etc.).
- **Novedades y Galería** — blog/novedades + media adjunta (imágenes/videos).

(La sección **Contacto** ya está tomada por Gabriel como referencia end-to-end.)

### Qué hace "dueño de una sección"

- Implementa la **vista/feature** en `apps/frontend/src/app/features/<seccion>/`
- Implementa los **endpoints/módulo** en `apps/backend/src/modules/<seccion>/`
- Si necesita tipos/schemas nuevos, los agrega en `packages/shared/src/dtos/<seccion>.ts`
- Si necesita códigos de error nuevos, los agrega en `packages/shared/src/errores/codigos.ts` **y** los documenta en `docs/CODIGOS_ERROR.md` en el mismo PR
- Si cambia o agrega endpoints, actualiza `contracts/openapi.yaml` **en el mismo PR**
- Escribe al menos 1 test por cada cosa no trivial

---

## 2. Ramas y PRs

**Trunk-based simplificado** (sin rama develop). Una sola rama larga: `main`.

### Cómo nombrar ramas

```
feature/<seccion>/<descripcion-corta-en-kebab-case>
fix/<seccion>/<descripcion>
docs/<descripcion>
chore/<descripcion>
```

Ejemplos:
```
feature/novedades/listado-con-paginacion
fix/contacto/validacion-email
docs/codigos-error-servicios
```

### Flujo estándar

```bash
# 1) Partí de main actualizado
git checkout main
git pull

# 2) Creá tu rama
git checkout -b feature/novedades/listado-inicial

# 3) Codeá, committeá seguido (commits chicos)
git add .
git commit -m "feat(novedades): agrega endpoint GET /novedades"

# 4) Subí y abrí PR
git push -u origin feature/novedades/listado-inicial
```

### Reglas de PR

- **Un PR = un cambio acotado.** Mejor 3 PRs chicos que uno de 1000 líneas.
- **Commits en español**, estilo Conventional Commits:
  - `feat(<seccion>): ...`
  - `fix(<seccion>): ...`
  - `docs(<seccion>): ...`
  - `chore: ...`
  - `test(<seccion>): ...`
- **CI tiene que estar verde** antes de pedir review.
- **Al menos 1 aprobación** para mergear a `main`.
- **Squash-merge** a `main` (así el historial queda limpio).
- Si tocás una **zona compartida** (ver sección 3), pedí review de al menos 2 personas.

---

## 3. Zonas compartidas (cuidado extra)

Estas rutas son de **todos**. No las edites "de pasada": abrí un PR dedicado y avisá al grupo.

- `apps/frontend/src/app/app.routes.ts` — registro de rutas
- `apps/frontend/src/app/app.config.ts` — providers globales
- `apps/frontend/src/app/shared/**` — componentes compartidos (navbar, footer, etc.)
- `apps/frontend/src/app/core/**` — servicios globales, interceptores, config
- `apps/backend/src/app.module.ts` — registro de módulos
- `apps/backend/src/comunes/**` — filtros, pipes, persistencia
- `apps/backend/prisma/**` — schema + migraciones
- `packages/shared/**` — tipos, DTOs, códigos de error
- `contracts/openapi.yaml` — contrato API
- `apps/frontend/src/styles/**` — design tokens, base, utilidades
- `docker-compose.yml`, `docker/**`, `.github/**` — infraestructura
- `package.json` de la raíz

Regla simple: **¿lo usan 2 o más integrantes?** Entonces es zona compartida.

---

## 4. Contrato y tipos compartidos (`@mutual-metrics/shared`)

El paquete `packages/shared` es la **única fuente de verdad** para:

- **Códigos de error** — `packages/shared/src/errores/codigos.ts`
- **Envelope de error** — `packages/shared/src/errores/envelope.ts`
- **DTOs / schemas Zod** de cada sección — `packages/shared/src/dtos/<seccion>.ts`

### Cómo importar desde tu sección

**Frontend:**
```ts
import {
  ContactoRequestSchema,
  ContactoRequest,
  CodigoError,
  EnvelopeError,
} from '@mutual-metrics/shared';
```

**Backend (NestJS):**
```ts
import { ContactoRequestSchema, CodigoError } from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
```

### Cómo agregar un DTO nuevo para tu sección

1. Crear `packages/shared/src/dtos/<mi-seccion>.ts` con el schema Zod y el tipo inferido.
2. Exportarlo desde `packages/shared/src/dtos/index.ts`.
3. Correr `npm run build:shared`.
4. Usarlo en frontend y backend.
5. Actualizar `contracts/openapi.yaml` con el endpoint correspondiente.

### Persistencia (Prisma + SQLite)

1. Editar `apps/backend/prisma/schema.prisma` — agregar tu modelo.
2. Correr `npm run prisma:migrate -- --name agrega-modelo-<cosa>`.
3. Commitear `schema.prisma` + `prisma/migrations/<timestamp>_.../`.
4. En tu service, inyectar `PrismaService` (ya global): `constructor(private prisma: PrismaService) {}`.

### Media (imágenes/videos)

MVP: usar URLs externas (links directos a imágenes hosteadas). Si tu sección requiere upload real al servidor, abrí la discusión en el grupo antes — implica decidir storage y cambia el patrón.

### Paginación — endpoints que listan

Convención del proyecto: `?page=1&tamano=20` → respuesta `Paginado<T>`.

```ts
import { ParametrosPaginacionSchema, Paginado } from '@mutual-metrics/shared';

@Get()
listar(@Query(new ZodValidationPipe(ParametrosPaginacionSchema)) q: ParametrosPaginacion): Promise<Paginado<MiTipo>> {
  // ...
}
```

### Ejemplo completo (ver sección Contacto)

`features/contacto/` y `modules/contacto/` están implementadas **como referencia**. Si no sabés por dónde empezar, copiá la estructura de esa sección y adaptala a la tuya.

---

## 5. Errores — siempre con envelope

**Toda respuesta de error** del backend sigue el formato:

```json
{
  "error": {
    "code": "CODIGO_EN_MAYUSCULAS",
    "message": "Mensaje legible en español",
    "details": {  },
    "traceId": "opcional"
  }
}
```

- En backend **no lances `throw new Error(...)` pelado**. Lanzá un `HttpException` de NestJS con `{ code, message, details? }`, o dejá que el pipe Zod convierta una validación fallida en `ENTRADA_INVALIDA`. El `FiltroExcepcionesGlobal` se encarga de darle la forma final.
- En frontend **no parsees errores a mano**. El `erroresInterceptor` ya te entrega un `EnvelopeError` tipado.
- **Nunca muestres un stack trace al usuario.** Mostrá `envelope.error.message`.

Catálogo completo de códigos: [`docs/CODIGOS_ERROR.md`](./docs/CODIGOS_ERROR.md).

---

## 6. Tests — TDD con cobertura 80%

El proyecto sigue **TDD**: escribimos el test antes de la implementación.

**Meta de coverage:** 80% en branches, functions, lines, statements.

El threshold está en los configs (`vitest.config.ts`, `jest.coverageThreshold`) pero el enforce está comentado hasta que cada sección tenga TDD real (los stubs no lo alcanzan). Al implementar tu sección: activá el threshold en tu scope y mantenelo verde.

### Capas de testing

| Capa | Runner | Ubicación |
|---|---|---|
| Unit frontend | Vitest + Angular testing | `*.spec.ts` junto al archivo |
| Unit backend | Jest + `@nestjs/testing` | `*.spec.ts` junto al archivo |
| Unit shared | Vitest | `*.test.ts` junto al archivo |
| Integration backend | Jest + supertest | `*.spec.ts` (mismo runner que unit) |

### Responsabilidades

- **Cada dueño de sección** escribe los tests unit + integration mínimos de su sección siguiendo TDD.
- **Gabriel (@Nubiru)** actúa como evaluador cross-cutting: revisa cobertura y agrega behavior tests faltantes.

### Comandos

```bash
npm test              # unit en los 3 workspaces
npm run test:cov      # con coverage + thresholds (falla si <80%)
```

---

## 7. Definición de Terminado (DoD)

Una feature está **terminada** cuando:

- [ ] Código en frontend y backend
- [ ] DTOs/schemas en `packages/shared` si aplica
- [ ] `contracts/openapi.yaml` actualizado si se agregaron endpoints
- [ ] Códigos de error nuevos documentados en `docs/CODIGOS_ERROR.md`
- [ ] Tests básicos pasando
- [ ] CI verde
- [ ] PR con al menos 1 aprobación
- [ ] README de la sección (si existe) actualizado con el alcance real

---

## 8. Dependencias y auditoría (`npm audit`)

El ecosistema JS reporta seguido "vulnerabilidades" que en realidad están en **dependencias transitivas de herramientas de desarrollo** (Angular CLI, vite, test runners). Este repo se armó con **0 vulnerabilidades** al commit inicial — si `npm install` te muestra warnings después, hacé:

```bash
# 1) Ver qué son
npm audit

# 2) Arreglar lo no-breaking
npm audit fix

# 3) Si quedan cosas breaking — NO uses "--force" sin hablarlo con el grupo.
#    Avisá en el chat: alguien (con Claude) decide si bumpeamos versiones.
```

**Regla:** no commitear un `package-lock.json` con vulnerabilidades high o critical. Moderate en dev-only se toleran si están discutidas.

---

## 9. Comandos que usás todos los días

```bash
npm install                    # primera vez o tras cambios en deps
npm run dev                    # FE + BE en paralelo
npm run build:shared           # tras tocar packages/shared
npm test                       # todos los tests
npm run docker:up              # probar con contenedores

git checkout -b feature/<seccion>/<cosa>
git commit -m "feat(<seccion>): ..."
git push -u origin HEAD
```

---

## 10. Dudas y decisiones

Si hay que decidir algo que afecta a todos (un cambio en el contrato, en los códigos de error, en la estructura, etc.), **abrí un issue** o un PR de docs y etiquetá al grupo. No decidas vos solo sobre zonas compartidas.

Para decisiones arquitectónicas grandes usamos **ADRs** (Architectural Decision Records) en `docs/adr/`. Hay un template en `docs/adr/0001-template.md`.

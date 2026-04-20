# Módulo backend: Escenarios (Slice 4)

**Dueño:** @Franco1212
**Feature frontend:** `apps/frontend/src/app/features/historial/`

## Alcance

Persistencia de cálculos realizados por el usuario autenticado. Permite guardar una ejecución (de Cuadrática o Pricing), listarlas paginadas, ver detalle y borrar.

## Endpoints propuestos

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/api/v1/escenarios` | `EscenarioCreate` (tipo, inputs, outputs) | `201 Escenario` |
| GET | `/api/v1/escenarios?page=1&tamano=20&tipo=cuadratica` | — | `Paginado<Escenario>` |
| GET | `/api/v1/escenarios/:id` | — | `Escenario` |
| DELETE | `/api/v1/escenarios/:id` | — | `204` |

Todos scoped al `usuarioId` del JWT. Si el escenario pertenece a otro usuario → `404 RECURSO_NO_ENCONTRADO` (no filtramos).

## Shared

Crear `packages/shared/src/dtos/escenarios.ts` con:
- `EscenarioSchema` — `{ id, usuarioId, tipo: 'cuadratica'|'pricing', inputs, outputs, creadoEn }`
- `EscenarioCreateSchema`
- Usar `Paginado<Escenario>` que ya existe.

## DB (Prisma)

Agregar a `apps/backend/prisma/schema.prisma`:

```prisma
model Escenario {
  id         String   @id @default(uuid())
  usuarioId  String
  tipo       String   // 'cuadratica' | 'pricing'
  inputs     String   // JSON stringified
  outputs    String   // JSON stringified
  creadoEn   DateTime @default(now())

  usuario    Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  @@index([usuarioId, creadoEn])
}
```

Correr `npm run prisma:migrate -- --name agrega-escenario`.

## Dependencia con Slice 1 (Auth)

Empezá con un `userId` mockeado (ej: extraído de un header custom) para no depender de que Auth esté listo. Cuando Slice 1 mergee, cambiás el mock por `JwtAuthGuard`.

## Tests

- Unit del service: CRUD + paginación + scope por usuario.
- Integration del controller con supertest.
- Cobertura ≥80%.

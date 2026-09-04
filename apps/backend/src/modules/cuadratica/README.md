# Módulo backend: Cuadrática (Slice 2)

**Dueño:** @marianof87
**Feature frontend:** `apps/frontend/src/app/features/cuadratica/`

## Alcance

Resolver la ecuación cuadrática `ax² + bx + c = 0`. Devuelve discriminante, raíces y vértice de la parábola.

## Endpoint implementado

| Método | Ruta | Request | Response | Errores |
|---|---|---|---|---|
| POST | `/api/v1/cuadratica/resolver` | `{ a, b, c }` (números) | `{ discriminante, tipo, raices, vertice }` | 400 `ENTRADA_INVALIDA`, 422 `CUADRATICA_A_CERO` |

Reglas de negocio (definidas en el dominio compartido):

- `a === 0` → la ecuación no es cuadrática → **422** `CUADRATICA_A_CERO`.
- `discriminante > 0` → `tipo: dosReales` con dos raíces reales.
- `discriminante === 0` → `tipo: unaRealDoble` (raíz duplicada).
- `discriminante < 0` → `tipo: sinRaicesReales` con `raices: null`.

## Shared

La matemática vive en `packages/shared`, el backend solo la importa (no duplica lógica):

- **Dominio puro:** `packages/shared/src/dominio/cuadratica/cuadratica.ts` → `resolverCuadratica(a, b, c)`.
- **DTOs compartidos:** `packages/shared/src/dtos/cuadratica.ts` → `CuadraticaRequestSchema`, `CuadraticaResponseSchema` (+ tipos inferidos con `z.infer`).

## Flujo de errores

- Validación del body: `ZodValidationPipe` → **400** `ENTRADA_INVALIDA` (patrón repo).
- `CUADRATICA_A_CERO`: el dominio lanza `Error(código)` y `CuadraticaService` lo traduce a `UnprocessableEntityException` → **422** con el envelope estándar.

## Tests

- Unit del dominio y DTOs en `packages/shared` (vitest).
- Unit del `CuadraticaService` y de `CuadraticaController` + integración HTTP (Supertest) en `apps/backend/src/modules/cuadratica/*.spec.ts` (jest).

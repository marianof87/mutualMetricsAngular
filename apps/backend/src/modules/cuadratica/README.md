# Módulo backend: Cuadrática (Slice 2)

**Dueño:** @marianof87
**Feature frontend:** `apps/frontend/src/app/features/cuadratica/`

## Alcance

Resolver la ecuación cuadrática `ax² + bx + c = 0`. Devuelve discriminante, raíces (reales o complejas) y vértice de la parábola.

## Endpoints propuestos

| Método | Ruta | Request | Response | Errores |
|---|---|---|---|---|
| POST | `/api/v1/cuadratica/resolver` | `CuadraticaRequest` (a, b, c) | `CuadraticaResponse` (discriminante, raices, vertice) | `ENTRADA_INVALIDA`, `CUADRATICA_A_CERO` |

## Shared

Crear dos archivos en `packages/shared`:

**`packages/shared/src/dominio/cuadratica/index.ts`** — funciones puras reusables:
```ts
export function discriminante(a: number, b: number, c: number): number;
export function raices(a: number, b: number, c: number): { reales: [number, number] | null, complejas?: [string, string] };
export function vertice(a: number, b: number, c: number): { x: number, y: number };
```

**`packages/shared/src/dtos/cuadratica.ts`** — schemas Zod + tipos inferidos.

El backend **importa** estas funciones; no duplica la matemática.

## Códigos de error a agregar

- `CUADRATICA_A_CERO` — cuando `a === 0` (no es cuadrática, es lineal).
- `CUADRATICA_SIN_RAICES_REALES` (sólo si la política del proyecto pide advertirlo explícitamente).

## Tests

- Unit de las funciones puras en `packages/shared/src/dominio/cuadratica/*.test.ts` (vitest).
- Unit del controller en este módulo.
- Cobertura ≥80% en tu scope.

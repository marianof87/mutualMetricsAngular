# Módulo backend: Inicio

**Dueño:** TBD
**Feature frontend relacionada:** `apps/frontend/src/app/features/inicio/`

## Alcance

Endpoints para la sección Inicio (Home). Podés agregar acá cualquier dato dinámico que el frontend necesite en la home (stats, destacados, etc.).

## Endpoints actuales

- `GET /api/v1/inicio/saludo` — placeholder.

## Para agregar un endpoint

1. Agregá el método al controller `inicio.controller.ts`.
2. Si recibe body, definí el schema Zod en `packages/shared/src/dtos/inicio.ts` y validalo con `ZodValidationPipe`.
3. Actualizá `contracts/openapi.yaml`.
4. Agregá al menos 1 test en `inicio.controller.spec.ts`.

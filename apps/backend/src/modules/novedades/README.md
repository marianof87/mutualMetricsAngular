# Módulo backend: Novedades (Slice 5)

**Dueño:** @Ange1809
**Feature frontend:** `apps/frontend/src/app/features/novedades/`

## Alcance

Blog/novedades del proyecto. Listado paginado + detalle. Media (imágenes) por URL externa.

## Endpoints propuestos

| Método | Ruta | Request | Response |
|---|---|---|---|
| GET | `/api/v1/novedades?page=1&tamano=20` | — | `Paginado<Novedad>` |
| GET | `/api/v1/novedades/:id` | — | `Novedad` |
| POST | `/api/v1/novedades` | `NovedadCreate` | `201 Novedad` (opcional: podés dejar el seed en DB y no exponer POST) |

## Shared

Crear `packages/shared/src/dtos/novedades.ts` con `NovedadSchema` y `NovedadCreateSchema`.

## DB

Modelo `Novedad(id, titulo, cuerpo, imagenUrl, publicadoEn)` en Prisma.

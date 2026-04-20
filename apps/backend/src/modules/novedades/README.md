# Módulo backend: Novedades

**Dueño:** TBD
**Feature frontend relacionada:** `apps/frontend/src/app/features/novedades/`

## Alcance

Endpoints para la sección Novedades + Galería (blog/noticias + media adjunta).

## Endpoints actuales

- `GET /api/v1/novedades` — placeholder (devuelve lista vacía).

## Propuestas (definir con el dueño)

- `GET /api/v1/novedades` — listado con paginación.
- `GET /api/v1/novedades/:id` — detalle.
- `POST /api/v1/novedades` — crear (si hay admin).
- Media (imágenes/videos) referenciada por URL; evitar subir archivos al backend en MVP.

## Para agregar un endpoint

Ver el módulo `contacto/` como referencia.

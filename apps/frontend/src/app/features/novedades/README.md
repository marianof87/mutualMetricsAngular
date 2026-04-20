# Feature: Novedades y Galería (Slice 5)

**Dueño:** @Ange1809
**Ruta:** `/novedades`
**Backend:** `apps/backend/src/modules/novedades/`

## Alcance (consigna del profesor)

Publicaciones, noticias, actualizaciones del proyecto. Galería de imágenes embebida (URLs externas).

## Estado

- [ ] Listado paginado de novedades (usa `Paginado<Novedad>`)
- [ ] Vista de detalle de una novedad
- [ ] Schema `Novedad` en `packages/shared/src/dtos/novedades.ts`
- [ ] Modelo `Novedad` en Prisma + migración
- [ ] Endpoints backend (CRUD o sólo GET si es read-only) + tests
- [ ] Responsive
- [ ] Test mínimo de render

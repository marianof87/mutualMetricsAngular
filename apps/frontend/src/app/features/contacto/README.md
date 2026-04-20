# Feature: Contacto (Slice 5)

**Dueño:** @Ange1809 — implementación de referencia por @Nubiru
**Ruta:** `/contacto`
**Backend:** `apps/backend/src/modules/contacto/`
**Schema compartido:** `packages/shared/src/dtos/contacto.ts`

## Alcance

Formulario de contacto. Envía `POST /api/v1/contactos` con `{ nombre, email, mensaje }` y recibe `{ id, recibidoEn }`.

Esta feature está **completa** y sirve como **ejemplo end-to-end** para los demás slices:
- Form reactivo con validaciones alineadas al schema Zod compartido
- Service HTTP dedicado
- Manejo de errores vía el envelope estándar (interceptor global)
- Test mínimo del controller en backend

## Estado

- [x] Vista y formulario
- [x] Schema compartido (Zod)
- [x] Endpoint backend + test
- [ ] Persistencia real con Prisma (actualmente sólo se loguea en el servidor) — @Ange1809 completa
- [ ] Extender con redes sociales / dirección / mapa — @Ange1809 define

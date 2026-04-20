# Feature: Contacto

**Dueño:** @Nubiru
**Ruta:** `/contacto`
**Backend:** `apps/backend/src/modules/contacto/`
**Schema compartido:** `packages/shared/src/dtos/contacto.ts`

## Alcance

Formulario de contacto. Envía `POST /api/v1/contactos` con `{ nombre, email, mensaje }` y recibe `{ id, recibidoEn }`.

## Estado

- [x] Vista y formulario
- [x] Schema compartido (Zod)
- [x] Endpoint backend + test
- [ ] Persistencia real (actualmente sólo se loguea en el servidor)

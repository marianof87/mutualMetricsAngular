# Módulo backend: Contacto (Slice 5)

**Dueño:** @Ange1809 — implementación de referencia por @Nubiru
**Feature frontend:** `apps/frontend/src/app/features/contacto/`

## Endpoints

| Método | Ruta | Request | Response 2xx | Errores |
|---|---|---|---|---|
| POST | `/api/v1/contactos` | `ContactoRequest` | `201 ContactoResponse` | `422 ENTRADA_INVALIDA` |

## Notas

- `contacto.service.ts` genera un uuid y loguea; falta persistencia real con Prisma (pendiente @Ange1809).
- Este módulo + su feature frontend son la implementación de referencia del patrón FE↔BE del proyecto.

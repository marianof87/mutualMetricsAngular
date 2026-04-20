# Módulo backend: Contacto

**Dueño:** @Nubiru
**Feature frontend:** `apps/frontend/src/app/features/contacto/`

## Endpoints

| Método | Ruta | Request | Response 2xx | Errores |
|---|---|---|---|---|
| POST | `/api/v1/contactos` | `ContactoRequest` | `201 ContactoResponse` | `422 ENTRADA_INVALIDA` |

## Notas

- `contacto.service.ts` genera un uuid y loguea; falta persistencia real.

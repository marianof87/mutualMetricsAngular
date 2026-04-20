# Catálogo de códigos de error

Lista autoritativa. La fuente canónica en código está en `packages/shared/src/errores/codigos.ts` — este archivo es la **referencia humana**. Si agregás un código nuevo, actualizá **los dos** en el mismo PR.

## Convenciones

- Todos en **UPPER_SNAKE_CASE**.
- **Códigos generales** no llevan prefijo de sección (`ENTRADA_INVALIDA`, `ERROR_INTERNO`, etc.).
- **Códigos específicos de una sección** llevan el nombre de la sección como prefijo: `CONTACTO_EMAIL_INVALIDO`, `NOVEDADES_NO_PUBLICADA`, etc.
- Los mensajes (`message`) van **en español**, cortos y humanos.

## Códigos generales

| Código | HTTP | Uso |
|---|---|---|
| `ENTRADA_INVALIDA` | 400 / 422 | Payload mal formado o fallan validaciones. |
| `RECURSO_NO_ENCONTRADO` | 404 | Id inexistente, ruta inválida de recurso. |
| `NO_AUTORIZADO` | 401 | Falta autenticación (futuro). |
| `PROHIBIDO` | 403 | Autenticado pero sin permiso. |
| `CONFLICTO` | 409 | Intento de crear algo que ya existe (ej: email duplicado). |
| `LIMITE_EXCEDIDO` | 429 | Rate limit. |
| `ERROR_INTERNO` | 500 | Error no esperado en el servidor. |
| `SERVICIO_NO_DISPONIBLE` | 503 | Dependencia caída, mantenimiento, etc. |

## Códigos por sección

### Contacto
| Código | HTTP | Uso |
|---|---|---|
| `CONTACTO_EMAIL_INVALIDO` | 422 | Email con formato inválido (usualmente ya atrapado por Zod → `ENTRADA_INVALIDA`). |
| `CONTACTO_MENSAJE_VACIO` | 422 | Mensaje vacío o muy corto. |

### Inicio
*(pendiente — agregar según necesidad)*

### Sobre nosotros
*(pendiente — agregar según necesidad)*

### Servicios
*(pendiente — agregar según necesidad)*

### Novedades
*(pendiente — agregar según necesidad)*

## Cómo agregar un código nuevo

1. Agregar la constante a `packages/shared/src/errores/codigos.ts`.
2. Agregar la fila a la tabla correspondiente en este archivo.
3. Usarlo en tu controller/service (backend) y/o manejarlo en la UI (frontend).
4. Hacer un único PR con los 3 cambios.

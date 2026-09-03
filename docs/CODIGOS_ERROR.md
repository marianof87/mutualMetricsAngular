# Catálogo de códigos de error

Lista autoritativa. Fuente canónica en código: `packages/shared/src/errores/codigos.ts`. Si agregás un código, actualizá **los dos** en el mismo PR.

## Convenciones

- Todos en **UPPER_SNAKE_CASE**.
- **Códigos generales** sin prefijo (`ENTRADA_INVALIDA`, `ERROR_INTERNO`, etc.).
- **Códigos específicos de slice** con prefijo: `AUTH_*`, `CUADRATICA_*`, `PRICING_*`, `ESCENARIOS_*`, `NOVEDADES_*`, `CONTACTO_*`.
- Mensajes (`message`) en español, cortos y humanos.

## Códigos generales

| Código | HTTP | Uso |
|---|---|---|
| `ENTRADA_INVALIDA` | 400 / 422 | Payload mal formado o validaciones fallidas. |
| `RECURSO_NO_ENCONTRADO` | 404 | Id inexistente, ruta inválida. |
| `NO_AUTORIZADO` | 401 | Falta autenticación. |
| `PROHIBIDO` | 403 | Autenticado pero sin permiso. |
| `CONFLICTO` | 409 | Intento de crear algo que ya existe. |
| `LIMITE_EXCEDIDO` | 429 | Rate limit. |
| `ERROR_INTERNO` | 500 | Error inesperado en el servidor. |
| `SERVICIO_NO_DISPONIBLE` | 503 | Dependencia caída, mantenimiento. |

## Códigos por slice

### Slice 1 — Auth & Usuarios (@Nubiru)

| Código | HTTP | Uso |
|---|---|---|
| `AUTH_CREDENCIALES_INVALIDAS` | 401 | Email o password incorrectos en login. |
| `AUTH_EMAIL_YA_REGISTRADO` | 409 | Intento de registrar email ya existente. |
| `AUTH_TOKEN_EXPIRADO` | 401 | JWT expirado; pedir refresh. |
| `AUTH_TOKEN_INVALIDO` | 401 | JWT malformado o firma inválida. |

### Slice 2 — Cuadrática (@marianof87)

| Código | HTTP | Uso |
|---|---|---|
| `CUADRATICA_A_CERO` | 422 | `a === 0` — no es cuadrática, es lineal. |
| `SIMULACION_SIN_INCERTIDUMBRE` | 400 | Módulo actuarial: ambos coeficientes son fijos; no hay riesgo que simular. Se exige al menos un parámetro estocástico. |

### Slice 3 — Pricing (@Monzon1983)

| Código | HTTP | Uso |
|---|---|---|
| `PRICING_SENSIBILIDAD_CERO` | 422 | `k === 0`; no hay dependencia precio/demanda. |
| `PRICING_OPTIMO_FUERA_DE_RANGO` | 422 | El óptimo calculado cae fuera de los constraints de precio. |

### Slice 4 — Escenarios (@Franco1212)

| Código | HTTP | Uso |
|---|---|---|
| `ESCENARIOS_NO_ENCONTRADO` | 404 | El escenario solicitado no existe o fue eliminado. El CRUD (T1.3) lo usa también para un escenario de otro usuario (no se filtra acceso). |
| `ESCENARIOS_ACCESO_DENEGADO` | 403 | Reservado para futuros casos de uso. El CRUD actual (T1.3) **no** lo emite: recurso inexistente y ajeno responden 404 `ESCENARIOS_NO_ENCONTRADO`. |

### Slice 5 — Público & Contacto (@Ange1809)

| Código | HTTP | Uso |
|---|---|---|
| `CONTACTO_EMAIL_INVALIDO` | 422 | Email con formato inválido (usualmente ya atrapado por Zod → `ENTRADA_INVALIDA`). |
| `CONTACTO_MENSAJE_VACIO` | 422 | Mensaje vacío o muy corto. |
| (Novedades — pendiente) | — | — |

### Lead Magnet — captación de leads (gated content)

| Código | HTTP | Uso |
|---|---|---|
| `LEAD_EMAIL_INVALIDO` | 422 | Email laboral con formato inválido (usualmente ya atrapado por Zod → `ENTRADA_INVALIDA`). |
| `LEAD_WHATSAPP_INVALIDO` | 422 | WhatsApp con formato inválido (usualmente ya atrapado por Zod → `ENTRADA_INVALIDA`). |

## Cómo agregar un código nuevo

1. Agregar la constante a `packages/shared/src/errores/codigos.ts`.
2. Agregar la fila a la tabla correspondiente en este archivo.
3. Usarlo en tu controller/service (backend) y/o manejarlo en la UI (frontend).
4. Hacer un único PR con los 3 cambios.

# Feature: Cuadrática (Slice 2)

**Dueño:** @marianof87
**Ruta:** `/cuadratica`
**Backend:** `apps/backend/src/modules/cuadratica/`
**Shared:** `packages/shared/src/dominio/cuadratica/` + `packages/shared/src/dtos/cuadratica.ts`

## Alcance

- Form reactivo con inputs `a`, `b`, `c` (validación local: `a ≠ 0`, números finitos).
- Llamada `POST /api/v1/cuadratica/resolver` vía `CuadraticaService`; el resultado (discriminante, tipo, raíces, vértice) es la fuente de verdad del servidor.
- Estados: `enviando` (deshabilita el botón), éxito (panel de resultados), error (`role="alert"` con el mensaje del envelope normalizado por `erroresInterceptor`, p.ej. `CUADRATICA_A_CERO`).
- Precarga de `history.state.inputs` (integración con Historial): rellena el form y auto-resuelve con los coeficientes vigentes.
- Gráfico de la parábola con `chart.js` + `ng2-charts` (visual; se redibuja con los coeficientes del form). Colores tomados de los tokens `--mm-*` resueltos en runtime.
- Formato numérico en español (`Intl.NumberFormat('es-AR')`).

## Estado

- [x] Dominio puro en `packages/shared/src/dominio/cuadratica/` + tests
- [x] Schemas `CuadraticaRequest/Response` en shared
- [x] Endpoint backend + test
- [x] Componente front con form + chart + panel
- [x] Código de error `CUADRATICA_A_CERO` documentado
- [x] Tests FE

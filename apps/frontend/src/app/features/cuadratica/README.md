# Feature: Cuadrática (Slice 2)

**Dueño:** @marianof87
**Ruta:** `/cuadratica`
**Backend:** `apps/backend/src/modules/cuadratica/`
**Shared:** `packages/shared/src/dominio/cuadratica/` + `packages/shared/src/dtos/cuadratica.ts`

## Alcance

- Form reactivo con inputs `a`, `b`, `c` (validación: `a ≠ 0`, números finitos).
- Llamada `POST /api/v1/cuadratica/resolver`.
- Panel de resultados: discriminante, raíces (reales/complejas), vértice.
- Gráfico de la parábola con `chart.js` + `ng2-charts` (ya instalados). Marcadores en las raíces y el vértice.

## Estado

- [ ] Dominio puro en `packages/shared/src/dominio/cuadratica/` + tests
- [ ] Schemas `CuadraticaRequest/Response` en shared
- [ ] Endpoint backend + test
- [ ] Componente front con form + chart + panel
- [ ] Código de error `CUADRATICA_A_CERO` documentado
- [ ] Tests FE

# Feature: Pricing (Slice 3)

**Dueño:** @Monzon1983
**Ruta:** `/pricing`
**Backend:** `apps/backend/src/modules/pricing/`
**Shared:** `packages/shared/src/dominio/pricing/` + `packages/shared/src/dtos/pricing.ts`

## Alcance

- Form en **lenguaje de negocio** — precio actual, unidades vendidas, sensibilidad de demanda, costo variable, costos fijos (opcional).
- Gráfico con dos curvas superpuestas (Revenue y Profit) con marcadores en los dos vértices óptimos.
- Panel de métricas: precio óptimo para revenue, precio óptimo para profit, max revenue, max profit, break-even.
- (Opcional) Export PDF/CSV de los resultados.

## Estado

- [ ] Dominio puro en `packages/shared/src/dominio/pricing/` (demanda, revenue, profit, optimizar, validar) + tests
- [ ] Schemas en shared
- [ ] Endpoints backend (optimizar, break-even) + tests
- [ ] Componente con form + chart con 2 curvas + panel de métricas
- [ ] Códigos de error específicos documentados
- [ ] Tests FE

## Referencia obligatoria

El diseño del modelo matemático está en `/home/gabiota/personal/projects/files/mutual-metrics/mi-proyecto/docs/MVP_Feature_Blueprint.md` (inglés). Leelo antes de empezar.

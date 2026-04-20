# Módulo backend: Pricing (Slice 3)

**Dueño:** @Monzon1983
**Feature frontend:** `apps/frontend/src/app/features/pricing/`

## Alcance

Optimizador de precios y ganancia basado en modelado cuadrático del MVP de MutualMetrics.

Inputs en lenguaje de negocio: precio actual (P₀), unidades vendidas (Q₀), sensibilidad de demanda (k), costo variable (v), costos fijos (F).

Internamente calcula:
- Demanda: `Q(p) = Q₀ - k·(p - P₀)`
- Revenue: `R(p) = p · Q(p)`
- Profit: `π(p) = R(p) - v·Q(p) - F`
- Vértice óptimo: `p* = -b / 2a`
- Break-even: raíces de π(p) = 0

## Endpoints propuestos

| Método | Ruta | Request | Response |
|---|---|---|---|
| POST | `/api/v1/pricing/optimizar` | `PricingInput` (P₀, Q₀, k, v, F) | `PricingOutput` (precios óptimos, máx revenue/profit, curvas sampled) |
| POST | `/api/v1/pricing/break-even` | `PricingInput` | `BreakEvenOutput` (0/1/2 precios de break-even) |

## Shared

Crear en `packages/shared/src/dominio/pricing/`:

- `demanda.ts` — `Q(p)` builder
- `revenue.ts` — `R(p)` builder + sampler de puntos
- `profit.ts` — `π(p)` builder
- `optimizar.ts` — vértice, break-even, clamping a [minPrice, maxPrice]
- `validar.ts` — reglas de entrada (P₀>0, Q₀≥0, k>0, v≥0, F≥0)

Y en `packages/shared/src/dtos/pricing.ts`:
- `PricingInputSchema`, `PricingOutputSchema`, `BreakEvenOutputSchema`.

El backend **importa** estas funciones. Cero matemática inline en el controller.

## Códigos de error a agregar

- `PRICING_SENSIBILIDAD_CERO` — k=0 no tiene sentido.
- `PRICING_OPTIMO_FUERA_DE_RANGO` — el óptimo cae fuera de los constraints.

## Tests

- Unit de las funciones puras (vertex correctness, break-even con 0/1/2 raíces, edge cases: Q₀=0, v>P₀, k muy grande).
- Unit del controller.
- Cobertura ≥80%.

## Referencia

El diseño original está en `/home/gabiota/personal/projects/files/mutual-metrics/mi-proyecto/docs/MVP_Feature_Blueprint.md`. Léelo antes de implementar — está en inglés pero tiene toda la lógica del modelo.

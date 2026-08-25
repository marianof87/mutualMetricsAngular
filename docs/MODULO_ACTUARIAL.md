# Módulo Actuarial — Metrix AI

Documentación del módulo actuarial implementado en la rama `feature/cuadratica/actuarial` (slice 2, @marianof87).

## 1. Qué es

El módulo actuarial agrega una capa de **riesgo e incertidumbre** sobre el simulador cuadrático de ganancia
`G(P) = A·P² + B·P + C`. Los tres coeficientes (`A`, `B` y `C`) pueden declararse con **rangos
probabilísticos** y el motor corre una **simulación Monte Carlo** que responde:

- ¿Con 95% de certeza, entre qué precios está el óptimo?
- ¿Cuál es la probabilidad de perder plata vendiendo a un precio dado?
- ¿Cuál es el **piso de solvencia** (el precio mínimo que cubre el caso adverso)?
- ¿Los datos de entrada sostienen una parábola estable o hay que mejorar estimaciones?

Se alinea con `OBJ-2` de la visión fundacional: **honestidad antes que precisión** — nunca un número falso
con dos decimales, siempre un intervalo con su causa y una acción.

## 2. Matemática

### 2.1 Parámetros estocásticos

Los coeficientes `A`, `B` y `C` se modelan con una de tres distribuciones:

| Tipo | Campos | Uso |
|---|---|---|
| `fijo` | `valor` | Sin incertidumbre en ese coeficiente |
| `triangular` | `minimo, moda, maximo` | El dueño conoce mín., el valor más probable y máx. |
| `normal` | `minimo, maximo, nivelConfianza` | "Entre X e Y con un Z% de probabilidad": se deriva μ = (min+max)/2 y σ = (max−min)/(2·z), con z = cuantil de la normal estándar para (1+α)/2. La **normal se trunca** a [min, max] (re-sorteo hasta 100 intentos) para que nunca salgan costos absurdos (ej. negativos). |

Muestreo: transformada inversa (uniforme directa, triangular por tramos `F⁻¹(u)`, normal con Box-Muller).
RNG determinista `mulberry32` con semilla — **misma semilla ⇒ mismo resultado**.

### 2.2 Motor Monte Carlo

Existen dos variantes del motor, con la misma matemática:

- **`simularRiesgo`** (síncrono): usado en tests unitarios del dominio. Bloquea el event loop.
- **`simularRiesgoAsync`** (asíncrono): usado en producción (backend y frontend). Cede el control al
  event loop cada `TAMANO_LOTE = 5000` iteraciones via `setTimeout(0)`, evitando bloqueos prolongados.

Por cada una de las `nSimulaciones` (default 10.000, rango 100–25.000):

1. Sortear `aᵢ`, `bᵢ` y `cᵢ` de sus distribuciones.
2. Si `aᵢ ≥ 0` → muestra degenerada (demanda creciente con el precio): **se descarta y se cuenta** en `muestrasInvalidas`.
3. Calcular `p* = clamp(−bᵢ/(2aᵢ), precioMinimo, precioMaximo)` y `g* = aᵢ·p*² + bᵢ·p* + cᵢ`.
4. Calcular el **piso de equilibrio** de la muestra (raíz menor ≥ 0 de `G(P)=0`; `null` si ningún precio cubre los costos).

### 2.3 Estadística sobre las muestras

- **Percentiles por método R-7** (el mismo de numpy / `PERCENTILE.INC` de Excel).
- **Intervalo de confianza**: percentiles `(1−α)/2` y `(1+α)/2` (α default 0.95 → [P2.5, P97.5]).
- **Probabilidad de pérdida**: fracción de muestras válidas con `G(precio) < 0`, evaluada en el óptimo y (opcional) en el `precioActual`.
- **Piso de solvencia**: percentil `α` de los pisos de equilibrio; `null` si menos del `α` de las muestras tienen piso finito (estructura no solvente).
- **Curva de riesgo**: `P(pérdida | precio)` evaluada en un grid fijo de 50 precios entre `precioMinimo` y `precioMaximo` (entrada para el gráfico del frontend).
- **Advertencias causa → acción** (OBJ-2), que se activan cuando:
  - se descartó > 5% de muestras por `A ≥ 0` (los datos no sostienen una parábola estable);
  - > 10% de los escenarios pierden incluso en el óptimo (revisar costos o subir piso);
  - el intervalo del precio óptimo es amplio (> 20% de la mediana — mejorar la estimación de `A`);
  - no existe piso solvente para el nivel de confianza pedido.

## 3. Arquitectura

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Dominio puro (compartido) | `packages/shared/src/dominio/actuarial/` | `distribuciones.ts` (RNG + muestreo + `cuantilNormal`), `estadistica.ts` (media, desvío muestral, percentil R-7, `aDosDecimales`), `monteCarlo.ts` (`simularRiesgo`, `simularRiesgoAsync`, `tieneIncertidumbre`). Sin dependencias de Nest/Prisma. |
| Schemas compartidos | `packages/shared/src/dtos/actuarial.ts` | `ParametroEstocasticoSchema` (unión discriminada `fijo | triangular | normal` con `superRefine`), `SimulacionActuarialRequestSchema`, `SimulacionActuarialResponseSchema`, `GuardarSimulacionActuarialSchema`. Tipos vía `z.infer`. |
| Backend | `apps/backend/src/modules/actuarial/` | `POST /api/v1/actuarial/simulaciones` (service + controller async), `ActuarialPersistenciaService` (guarda resumen vinculado a Lead en Prisma). El service delega la matemática en `simularRiesgoAsync` y valida la condición de negocio "al menos un coeficiente estocástico". |
| Frontend | `apps/frontend/src/app/features/actuarial/` | Ejecuta `simularRiesgoAsync` **localmente en el browser** (sin roundtrip HTTP). Sliders de incertidumbre, tarjetas de resultados, percentiles, advertencias y gráfico responsive de la curva de riesgo (chart.js). Ruta lazy `/actuarial` en `app.routes.ts`. |
| Contrato | `contracts/openapi.yaml` | Endpoint + schemas `ParametroEstocastico`, `SimulacionActuarialRequest`, `DistribucionResumen`, `SimulacionActuarialResponse`. |
| Persistencia | `apps/backend/prisma/schema.prisma` | Modelo `SimulacionActuarial` con FK a `Lead`. Resumen de cada corrida (coeficienteBTipo, precioOptimoMedia/P5/P95, pisoSolvencia, probPerdida). |

Errores: validación Zod → `422 ENTRADA_INVALIDA` (envelope único); sin incertidumbre → `400 SIMULACION_SIN_INCERTIDUMBRE`
(ver `docs/CODIGOS_ERROR.md`). La condición la verifica el service y no el schema, para emitir el código
específico en lugar del 422 genérico; el motor corre igual el caso determinístico (útil en tests).

## 4. Contrato del endpoint

`POST /api/v1/actuarial/simulaciones`

### Request (ejemplo)

```json
{
  "coeficienteA": { "tipo": "triangular", "minimo": -3, "moda": -2, "maximo": -1 },
  "coeficienteB": { "tipo": "fijo", "valor": 120 },
  "coeficienteC": { "tipo": "normal", "minimo": -1100, "maximo": -900, "nivelConfianza": 0.9 },
  "precioMinimo": 10,
  "precioMaximo": 100,
  "precioActual": 30,
  "nSimulaciones": 10000,
  "nivelConfianza": 0.95,
  "semilla": 42
}
```

Los tres coeficientes aceptan `ParametroEstocastico` (`fijo | triangular | normal`). Para B estocástico:

```json
"coeficienteB": { "tipo": "triangular", "minimo": 80, "moda": 120, "maximo": 160 }
```

Campos opcionales: `precioActual` (evalúa el riesgo ahí), `semilla` (reproducibilidad exacta);
`nSimulaciones` y `nivelConfianza` tienen default (10.000 y 0.95).

### Response (ejemplo)

```json
{
  "nSimulaciones": 10000,
  "semilla": 42,
  "muestrasInvalidas": 0,
  "nivelConfianza": 0.95,
  "precioOptimo": {
    "media": 29.85, "mediana": 29.8, "desvio": 0.62,
    "percentiles": { "5": 28.81, "25": 29.44, "50": 29.8, "75": 30.27, "95": 30.92 },
    "intervalo": { "minimo": 28.64, "maximo": 31.07 }
  },
  "gananciaMaxima": { "media": 802.5, "mediana": 800, "desvio": 45.1, "percentiles": {}, "intervalo": { "minimo": 720.1, "maximo": 891.2 } },
  "puntoEquilibrio": { "media": 10.1, "mediana": 10, "desvio": 0.4, "percentiles": {}, "intervalo": { "minimo": 9.2, "maximo": 11.1 } },
  "pisoSolvencia": 11.05,
  "probabilidadPerdida": { "enPrecioOptimo": 0, "enPrecioActual": 0 },
  "curvaRiesgo": [
    { "precio": 10, "probabilidadPerdida": 0.01 },
    { "precio": 11.84, "probabilidadPerdida": 0.03 }
  ],
  "advertencias": []
}
```

### Persistencia (resumen)

Las simulaciones se persisten en `SimulacionActuarial` (Prisma) vinculadas a un `Lead` opcional:

```json
{
  "leadId": "uuid-lead",
  "coeficienteBTipo": "fijo",
  "nSimulaciones": 10000,
  "nivelConfianza": 0.95,
  "precioOptimoMedia": 29.85,
  "precioOptimoP5": 28.81,
  "precioOptimoP95": 30.92,
  "pisoSolvencia": 11.05,
  "probPerdidaOptimo": 0.02,
  "probPerdidaActual": 0.05
}
```

Validado por `GuardarSimulacionActuarialSchema` (Zod). `coeficienteBTipo` se determina automáticamente
inspeccionando `solicitud.coeficienteB`.

## 5. Tests

**Total: 179 tests** (113 shared + 32 backend + 34 frontend). Detalle completo en `docs/TESTING_ACTUARIAL.md`.

Estrategia de pruebas (TDD, cobertura en 4 capas):

- **Shared (vitest)** — `distribuciones.test.ts`, `estadistica.test.ts`, `monteCarlo.test.ts`,
  `dtos/actuarial.test.ts`, `propiedadesActuarial.test.ts` (fast-check):
  - determinístico exacto, reproducibilidad, B estocástico en el motor, boundaries de chunking async,
    invariantes de respuesta, muestras degeneradas, schemas Zod (request, response y persistencia),
    property-based con fast-check.
- **Backend (jest + supertest)** — `actuarial.service.spec.ts`, `actuarial.controller.spec.ts`,
  `actuarial-persistencia.service.spec.ts`: validación de negocio, integración HTTP, persistencia con Prisma.
- **Frontend (vitest + jsdom)** — `actuarial.component.spec.ts` (con `vi.useFakeTimers` para flush async),
  `actuarial.service.spec.ts`.
- **Rendimiento** — `apps/backend/bench/` (motor sync/async y concurrencia HTTP).

## 6. Decisiones técnicas

- **El dominio vive en shared, no en `modules/cuadratica`** (decidido con el dueño): patrón del
  `optimizador` existente, único lugar con la matemática, testeable y compartido FE/BE.
- **B estocástico habilitado**: el schema, el muestreo en el motor y el contrato lo soportan.
  `tieneIncertidumbre` validaba B estocástico desde v1; el schema era el cuello de botella.
- El motor **permite fijo+fijo+fijo** como caso degenerado determinístico; la protección de negocio la aplica
  el service con un código de error específico (`SIMULACION_SIN_INCERTIDUMBRE`).
- Los errores matemáticos del dominio se traducen en el service a `422 ENTRADA_INVALIDA` dentro del envelope
  único, por si el motor gana validaciones nuevas.
- La pérdida no sale del vértice (la parábola en su máximo es ≥ su mínimo), sale de **vender a un precio
  dado**: por eso la curva de riesgo y la probabilidad en el óptimo capturan la falta de solvencia.

### 6.1 Procesamiento asíncrono por lotes

`simularRiesgoAsync` cede el control al event loop cada `TAMANO_LOTE = 5000` iteraciones via
`setTimeout(0)`. Esto evita bloqueos prolongados del event loop en Node.js y en el browser.

| nSimulaciones | Tiempo aprox. | Bloqueo máximo del event loop |
|---|---|---|
| 1.000 | ~34 ms | ~34 ms (1 solo lote) |
| 5.000 | ~50 ms | ~50 ms (1 solo lote) |
| 10.000 (default) | ~108 ms | ~50 ms |
| 25.000 (máx.) | ~400 ms | ~50 ms |

`simularRiesgo` (síncrono) se mantiene para tests unitarios de dominio donde el determinismo
y la simplicidad son prioridad. En producción se usa `simularRiesgoAsync`.

### 6.2 Ejecución local en el frontend

El frontend ejecuta `simularRiesgoAsync` directamente en el browser dentro de `setTimeout(async () => { ... }, 0)`.
Esto reduce latencia (sin roundtrip HTTP) y descarga el backend. El servicio HTTP se mantiene
como fallback opcional.

### 6.3 Persistencia

Las simulaciones se guardan como `SimulacionActuarial` (resumen) vinculadas a un `Lead` opcional
(vía FK `leadId`). Se persisten solo los campos necesarios para auditoría del producto (OBJ-2):
coeficienteBTipo, precioOptimo (media/P5/P95), pisoSolvencia, probPerdida.

## 7. Pendientes

- Distribuciones adicionales (log-normal, PERT).
- Histograma de la distribución del precio óptimo en el frontend (hoy se muestra la curva de riesgo).
- E2E con Playwright (flujo form → POST → renderizado de resultados y advertencias): postergado
  deliberadamente; los tests unitarios del componente + la integración HTTP cubren la misma superficie
  con mucho menos mantenimiento.
- Conexión del frontend con `ActuarialPersistenciaService` (actualmente la persistencia solo está
  expuesta en el endpoint backend, el frontend ejecuta localmente sin persistir).

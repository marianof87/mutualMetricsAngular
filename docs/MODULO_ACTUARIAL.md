# Módulo Actuarial — Metrix AI

Documentación del módulo actuarial implementado en la rama `feature/cuadratica/actuarial` (slice 2, @marianof87).

## 1. Qué es

El módulo actuarial agrega una capa de **riesgo e incertidumbre** sobre el simulador cuadrático de ganancia
`G(P) = A·P² + B·P + C`. En lugar de asumir que `A` (sensibilidad de la demanda) y `C` (término
independiente neto, costos fijos con signo) son números fijos, el dueño los declara con **rangos
probabilísticos** y el motor corre una **simulación Monte Carlo** que responde:

- ¿Con 95% de certeza, entre qué precios está el óptimo?
- ¿Cuál es la probabilidad de perder plata vendiendo a un precio dado?
- ¿Cuál es el **piso de solvencia** (el precio mínimo que cubre el caso adverso)?
- ¿Los datos de entrada sostienen una parábola estable o hay que mejorar estimaciones?

Se alinea con `OBJ-2` de la visión fundacional: **honestidad antes que precisión** — nunca un número falso
con dos decimales, siempre un intervalo con su causa y una acción.

## 2. Matemática

### 2.1 Parámetros estocásticos

El coeficiente `A` (estocástico en v1) y `C` (estocástico en v1) se modelan con una de tres
distribuciones (`B` queda fijo):

| Tipo | Campos | Uso |
|---|---|---|
| `fijo` | `valor` | Sin incertidumbre en ese coeficiente |
| `triangular` | `minimo, moda, maximo` | El dueño conoce mín., el valor más probable y máx. |
| `normal` | `minimo, maximo, nivelConfianza` | "Entre X e Y con un Z% de probabilidad": se deriva μ = (min+max)/2 y σ = (max−min)/(2·z), con z = cuantil de la normal estándar para (1+α)/2. La **normal se trunca** a [min, max] (re-sorteo hasta 100 intentos) para que nunca salgan costos absurdos (ej. negativos). |

Muestreo: transformada inversa (uniforme directa, triangular por tramos `F⁻¹(u)`, normal con Box-Muller).
RNG determinista `mulberry32` con semilla — **misma semilla ⇒ mismo resultado**.

### 2.2 Motor Monte Carlo (`simularRiesgo`)

Por cada una de las `nSimulaciones` (default 10.000, rango 100–100.000):

1. Sortear `aᵢ` y `cᵢ` de sus distribuciones.
2. Si `aᵢ ≥ 0` → muestra degenerada (demanda creciente con el precio): **se descarta y se cuenta** en `muestrasInvalidas`.
3. Calcular `p* = clamp(−B/(2a), precioMinimo, precioMaximo)` y `g* = a·p*² + B·p* + c`.
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
| Dominio puro (compartido) | `packages/shared/src/dominio/actuarial/` | `distribuciones.ts` (RNG + muestreo + `cuantilNormal`), `estadistica.ts` (media, desvío muestral, percentil R-7, `aDosDecimales`), `monteCarlo.ts` (`simularRiesgo`). Sin dependencias de Nest/Prisma. |
| Schemas compartidos | `packages/shared/src/dtos/actuarial.ts` | `ParametroEstocasticoSchema` (unión discriminada `fijo | triangular | normal` con `superRefine`), `SimulacionActuarialRequestSchema`, `SimulacionActuarialResponseSchema`. Tipos vía `z.infer`. |
| Backend | `apps/backend/src/modules/actuarial/` | `POST /api/v1/actuarial/simulaciones`. El service **delega** la matemática en el dominio (no la duplica, a diferencia del anti-patrón de `optimizador.service.ts`) y valida la condición de negocio "al menos un coeficiente estocástico". |
| Frontend | `apps/frontend/src/app/features/actuarial/` | `actuarial.service.ts` (patrón `contacto.service.ts`, `entorno.apiBaseUrl`), `actuarial.component.{ts,html,css}` con sliders de incertidumbre, tarjetas de resultados, percentiles, advertencias y gráfico de la curva de riesgo (chart.js). Ruta lazy `/actuarial` en `app.routes.ts`. |
| Contrato | `contracts/openapi.yaml` | Endpoint + schemas `ParametroEstocastico`, `SimulacionActuarialRequest`, `DistribucionResumen`, `SimulacionActuarialResponse`. |

Errores: validación Zod → `422 ENTRADA_INVALIDA` (envelope único); sin incertidumbre → `400 SIMULACION_SIN_INCERTIDUMBRE`
(ver `docs/CODIGOS_ERROR.md`). La condición la verifica el service y no el schema, para emitir el código
específico en lugar del 422 genérico; el motor corre igual el caso determinístico (útil en tests).

## 4. Contrato del endpoint

`POST /api/v1/actuarial/simulaciones`

### Request (ejemplo)

```json
{
  "coeficienteA": { "tipo": "triangular", "minimo": -3, "moda": -2, "maximo": -1 },
  "coeficienteB": 120,
  "coeficienteC": { "tipo": "normal", "minimo": -1100, "maximo": -900, "nivelConfianza": 0.9 },
  "precioMinimo": 10,
  "precioMaximo": 100,
  "precioActual": 30,
  "nSimulaciones": 10000,
  "nivelConfianza": 0.95,
  "semilla": 42
}
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

## 5. Tests

Estrategia de pruebas del módulo (TDD, cobertura en 4 capas):

- **Shared (vitest)** — `packages/shared/src/dominio/actuarial/*.test.ts`, `dtos/actuarial.test.ts` y
  `propiedadesActuarial.test.ts` (fast-check):
  - invariantes matemáticas (media empírica ≈ media teórica, percentiles R-7 con valores a mano, desvío acotado);
  - caso determinístico exacto (vértice, piso, curva de riesgo escalón 0/1);
  - probabilidad de pérdida calculada a mano con tolerancia;
  - reproducibilidad: misma semilla ⇒ misma respuesta; semilla distinta ⇒ respuesta distinta;
  - muestras degeneradas (`A ≥ 0`) contadas y advertidas;
  - schemas Zod: defaults, rechazos (rangos, moda, precios, N, confianza, semilla, tipo);
  - invariantes de salida: P5 ≤ P50 ≤ P95, probabilidad ∈ [0,1], `muestrasInvalidas` entero ≥ 0,
    sin NaN/infinitos, `pisoSolvencia` null o ≥ 0;
  - property-based: cientos de combinaciones aleatorias de solicitudes y distribuciones (fast-check)
    sin crash, sin NaN y con muestreos siempre dentro de [min, max].
- **Backend (jest + supertest)** — `actuarial.service.spec.ts` (código `SIMULACION_SIN_INCERTIDUMBRE`,
  delegación al dominio, traducción de errores) y `actuarial.controller.spec.ts` (integración HTTP:
  200 validado por el schema compartido, reproducibilidad por semilla a nivel HTTP, 400
  `ENTRADA_INVALIDA` y `SIMULACION_SIN_INCERTIDUMBRE`, caso degenerado con advertencia).
- **Frontend (vitest + jsdom)** — `actuarial.service.spec.ts` (POST a la URL del entorno) y
  `actuarial.component.spec.ts` (request construido desde las señales, render de métricas/percentiles/
  advertencias, envelope de error, bloqueo sin incertidumbre, stub de canvas).
- **Rendimiento** — `apps/backend/bench/` (motor y concurrencia HTTP), script `test:rendimiento`
  (no entra en CI); resultados en §6.1.

Ejecución: `npm test --workspace=@mutual-metrics/shared`, `npm test --workspace=@mutual-metrics/backend`,
`npm test --workspace=@mutual-metrics/frontend` y `npm run test:rendimiento --workspace=@mutual-metrics/backend`.

## 6. Decisiones técnicas

- **El dominio vive en shared, no en `modules/cuadratica`** (decidido con el dueño): patrón del
  `optimizador` existente, único lugar con la matemática, testeable y compartido FE/BE.
- **Stateless en v1**: las corridas no se persisten (no se toca Prisma); el endpoint devuelve todo en la
  respuesta. Si se necesita historial, se puede ampliar `Escenario.tipo` a `actuarial`.
- El motor **permite fijo+fijo** como caso degenerado determinístico; la protección de negocio la aplica
  el service con un código de error específico (`SIMULACION_SIN_INCERTIDUMBRE`).
- La condición "al menos un coeficiente estocástico" se evalúa con `tieneIncertidumbre` (dominio
  compartido), que acepta coeficientes numéricos y paramétricos: si `coeficienteB` pasa a ser
  estocástico en el futuro, la validación sigue funcionando sin cambios.
- Los errores matemáticos del dominio (hoy inalcanzables porque Zod valida los rangos antes del motor)
  se traducen en el service a `422 ENTRADA_INVALIDA` dentro del envelope único, por si el motor gana
  validaciones nuevas.
- La pérdida no sale del vértice (la parábola en su máximo es ≥ su mínimo), sale de **vender a un precio
  dado**: por eso la curva de riesgo y la probabilidad en el óptimo capturan la falta de solvencia
  (costos que ni el mejor precio cubren).

### 6.1 Procesamiento síncrono: decisión medida

`simularRiesgo` es **síncrono**: bloquea el event loop de Node mientras corre. Medido con
`npm run test:rendimiento --workspace=@mutual-metrics/backend` (bench scripts en `apps/backend/bench/`,
Windows, engine compilado, en aislamiento):

| nSimulaciones | Tiempo | Ticks de event loop perdidos |
|---|---|---|
| 1.000 | ~34 ms | ~34 |
| 10.000 (default del schema) | ~108 ms | ~108 |
| 50.000 | ~391 ms | ~391 |
| 100.000 (máximo permitido) | ~851 ms | ~851 |

Los ticks perdidos ≈ duración: durante la simulación el event loop no atiende nada (el motor es
síncrono). Bajo carga concurrente se confirma la serialización: **5 requests de N=100.000 en paralelo
tardaron 5,7 s en total (p95 por request 5,7 s, +267 MB de heap)** — las peticiones se encolan, no se
superponen.

Con el perfil actual (default 10.000, uso de bajo volumen) el bloqueo es aceptable y se mantiene el
cálculo síncrono. Se descartan por ahora:

- **Worker Threads**: paralelismo real (~0.9 s → ~0.25 s), pero agrega script de worker, protocolo de
  mensajes y config de build/tests — desproporcionado sin evidencia de carga.
- **Cola de tareas (BullMQ/Redis)**: dependencia nueva + infraestructura para un proyecto sin carga.

Upgrade barato si algún día hay carga: **async por lotes** (chunks de ~10.000 muestras con
`await setImmediate()` entre lotes) — el event loop nunca queda bloqueado más de ~100 ms y el
determinismo se conserva (misma semilla, RNG secuencial). Revisitar esta sección cuando haya evidencia
de tráfico.

## 7. Pendientes fuera de alcance (v2)

- `CoeficienteB` estocástico: el engine y la validación (`tieneIncertidumbre`) ya están preparados; falta
  cambiar el schema (`coeficienteB` pasa de `z.number()` a `ParametroEstocastico`), el muestreo en el
  motor y el contrato.
- Distribuciones adicionales (log-normal, PERT).
- Persistencia de corridas como `Escenario` (Prisma + enum en contrato).
- Histograma de la distribución del precio óptimo en el frontend (hoy se muestra la curva de riesgo).
- E2E con Playwright (flujo form → POST → renderizado de resultados y advertencias): postergado
  deliberadamente; los tests unitarios del componente + la integración HTTP cubren la misma superficie
  con mucho menos mantenimiento.
# Testing del Módulo Actuarial — Metrix AI

Registro de los tests llevados a cabo sobre el módulo actuarial (Monte Carlo sobre
`G(P) = A·P² + B·P + C`), rama `feature/cuadratica/actuarial`. Complementa `docs/MODULO_ACTUARIAL.md` §5.

## 1. Estado general

| Suites | Tests | Resultado |
|---|---|---|
| Shared (`packages/shared`) — vitest | 113 | ✅ verdes |
| Backend (`apps/backend`) — jest + supertest | 32 | ✅ verdes |
| Frontend (`apps/frontend`) — vitest + jsdom | 34 | ✅ verdes |
| Rendimiento (`apps/backend/bench`) — ts-node | — | ✅ corre (no va en CI) |

**Total: 179 tests.**

Ejecución:

```bash
npm test --workspace=@mutual-metrics/shared
npm test --workspace=@mutual-metrics/backend
npm test --workspace=@mutual-metrics/frontend -- --watch=false
npm run test:rendimiento --workspace=@mutual-metrics/backend   # manual, no CI
```

---

## 2. Lógica de dominio y matemática (shared, vitest)

### 2.1 Distribuciones — `dominio/actuarial/distribuciones.test.ts` (13 tests)

- RNG `mulberry32`: determinista (misma semilla ⇒ misma secuencia), semillas distintas ⇒ secuencias distintas, salida en `[0, 1)`.
- Uniforme: valores en rango, media cerca del centro.
- Triangular: valores en `[min, max]`, media empírica converge a `(min + moda + max)/3` y al caso de moda desplazada `(min + 2·moda)/3`, parámetro degenerado (`min = moda = max`) devuelve siempre el valor.
- Normal truncada: nunca sale del rango, media cerca del centro, desvío acotado por el ancho del rango.
- Cuantil normal (Acklam): valores clásicos y monotonía creciente.

### 2.2 Estadística — `dominio/actuarial/estadistica.test.ts` (7 tests)

- Percentil R-7: valor central en arreglo impar, interpolación entre contiguos, extremos en P0/P100, independencia del orden de entrada.
- Media aritmética y desvío estándar muestral.
- Redondeo a dos decimales.

### 2.3 Motor Monte Carlo — `dominio/actuarial/monteCarlo.test.ts` (35 tests)

#### Caso determinístico (4 tests)
- Vértice en `P=30` con ganancia `800`, piso de equilibrio = raíz menor (`10`), curva de riesgo escalón 0/1, `precioActual` ubicado en la curva.

#### Reproducibilidad (2 tests)
- Misma semilla ⇒ respuesta idéntica (deep equal); semillas distintas ⇒ respuestas distintas.

#### Monte Carlo con incertidumbre chica (1 test)
- La media del precio óptimo converge a `-B/(2·E[A]) = 30` y la ganancia a `800`.

#### Probabilidad de pérdida (2 tests)
- Estimada a mano con tolerancia sobre el valor teórico.
- Sin piso solvente: `pisoSolvencia: null` + advertencia.

#### Muestras degeneradas (2 tests)
- `A ≥ 0` total: se descartan, se cuentan y advierten.
- `A ≥ 0` minoritario: se descartan parcialmente y advierten.

#### `tieneIncertidumbre` (4 tests)
- Falso con A/C fijos y B numérico; verdadero con A triangular, con C normal, y con B estocástico.

#### Invariantes de la respuesta (4 tests)
- `P5 ≤ P50 ≤ P95`, probabilidad en `[0, 1]`, `muestrasInvalidas` entero ≥ 0, sin NaN/infinitos, `pisoSolvencia` null o ≥ 0.

#### **B estocástico en el motor** (3 tests — NUEVO)
- **B triangular produce resultados válidos**: `precioOptimo.media > 0`, `gananciaMaxima.media > 0`, `curvaRiesgo.length = 50`, `muestrasInvalidas` entero ≥ 0.
- **B triangular produce resultados distintos a B fijo**: `precioOptimo.media` difiere entre las dos configuraciones.
- **B normal mantiene invariantes**: sin NaN, percentiles ordenados, probabilidad en `[0, 1]`.

#### `simularRiesgoAsync` — equivalencia (2 tests)
- Produce exactamente la misma respuesta que `simularRiesgo` para la misma semilla.
- Mantiene invariantes (sin NaN, percentiles ordenados, curva de 50 puntos).

#### **`simularRiesgoAsync` — boundaries de chunking** (3 tests — NUEVO)
- **n=5000** (==`TAMANO_LOTE`): equivale exactamente a la versión síncrona.
- **n=100** (<`TAMANO_LOTE`): produce resultado válido (el loop no cede el event loop ni una vez).
- **Equivalencia exacta sync/async con n=100**: `toEqual` idéntico.

### 2.4 Schemas Zod — `dtos/actuarial.test.ts` (19 tests)

#### SimulacionActuarialRequestSchema (10 tests)
- Acepta solicitud completa válida.
- Defaults: `nSimulaciones` → 10.000, `nivelConfianza` → 0.95, confianza del normal → 0.9.
- Rechazos: `minimo >= maximo`, moda fuera de rango, precios negativos, N fuera de `[100, 25000]`, confianza fuera de `[0.8, 0.99]`, semilla no entera/negativa, tipo desconocido.

#### SimulacionActuarialResponseSchema (2 tests)
- Acepta respuesta completa (con y sin piso/precio actual).

#### **GuardarSimulacionActuarialSchema** (7 tests — NUEVO)
- **Payload válido** con todos los campos: pasa.
- **Sin leadId**: pasa (simulación anónima).
- **probPerdidaOptimo > 1**: rechaza.
- **probPerdidaOptimo negativa**: rechaza.
- **leadId no UUID**: rechaza.
- **coeficienteBTipo inválido**: rechaza.
- **pisoSolvencia null / probPerdidaActual null**: acepta (campos nullable).

### 2.5 Property-based — `dominio/actuarial/propiedadesActuarial.test.ts` (4 tests, fast-check)

- **Invariantes sobre solicitudes aleatorias** (300 corridas, B ahora también estocástico): nunca lanza; sin NaN/infinitos; percentiles ordenados; probabilidad en `[0, 1]`; `muestrasInvalidas` entero ≥ 0; curva de 50 puntos; `pisoSolvencia` coherente.
- **Muestreos dentro de rango** (200 corridas c/u): triangular, normal truncada y fijo nunca salen de `[min, max]`.

---

## 3. Reglas de negocio y API (backend, jest + supertest)

### 3.1 Servicio — `modules/actuarial/actuarial.service.spec.ts` (5 tests)

- Sin incertidumbre (todo fijo) → `400 SIMULACION_SIN_INCERTIDUMBRE`.
- Con incertidumbre → delega en `simularRiesgoAsync` y devuelve la simulación.
- A/C fijos con **B estocástico** → pasa (validación genérica funciona).
- `RangeError` del motor → `422 ENTRADA_INVALIDA`.
- Otras excepciones se re-lanzan para el filtro global.

### 3.2 Persistencia — `modules/actuarial/actuarial-persistencia.service.spec.ts` (4 tests)

- **Guarda con campos resumidos**: verifica `leadId`, `coeficienteBTipo`, `nSimulaciones`, `precioOptimoMedia`, `pisoSolvencia`, `probPerdidaOptimo`, `probPerdidaActual`.
- **B triangular → "estocástico"**: `coeficienteBTipo` se marca correctamente.
- **leadId undefined → null**: simulación anónima.
- **Fallback percentiles** (NUEVO): mock con `percentiles: {}` → `precioOptimoP5 = intervalo.minimo`, `precioOptimoP95 = intervalo.maximo`.

### 3.3 Integración HTTP — `modules/actuarial/actuarial.controller.spec.ts` (8 tests)

- `POST /actuarial/simulaciones` → `200` validado contra `SimulacionActuarialResponseSchema`.
- **Reproducibilidad HTTP**: dos requests con la misma semilla → respuestas idénticas.
- `minimo > maximo` → `400 ENTRADA_INVALIDA`.
- Precios negativos → `400 ENTRADA_INVALIDA`.
- N fuera de rango → `400 ENTRADA_INVALIDA`.
- Sin incertidumbre → `400 SIMULACION_SIN_INCERTIDUMBRE`.
- Caso degenerado → `200` con `muestrasInvalidas = n` y advertencia.
- Unitario: delega en servicio mockeado.

---

## 4. Frontend (vitest + jsdom, `@angular/build:unit-test`)

### 4.1 Servicio — `features/actuarial/actuarial.service.spec.ts` (1 test)

- `simular()` hace `POST` a `${entorno.apiBaseUrl}/actuarial/simulaciones` con el body exacto.

### 4.2 Componente — `features/actuarial/actuarial.component.spec.ts` (8 tests)

#### Render y guard (3 tests — preexistentes)
- Render inicial: título, panel "Esperando simulación", botón habilitado.
- Sin incertidumbre: botón deshabilitado + mensaje de advertencia.
- `simular()` no avanza sin incertidumbre (early return).

#### Ejecución síncrona (1 test — preexistente)
- Verifica `cargando() === true` y `error() === null` inmediatamente después de `simular()`.

#### Datos auxiliares (1 test — preexistente)
- `percentilesDe()` mapea claves/valores correctamente.

#### **Ejecución asíncrona con fake timers** (2 tests — NUEVOS)
- **Flush con `vi.useFakeTimers()`**: llama `simular()`, avanza timers con `vi.advanceTimersByTimeAsync(0)` en loop, verifica que `resultado()` se popula con `nSimulaciones = 100`, `cargando()` vuelve a `false`, `error()` es `null`.
- **Escenarios degenerados (A >= 0)**: todos los samples inválidos, la simulación completa sin crashear, `cargando()` vuelve a `false`, `resultado()` tiene `muestrasInvalidas = 100`.

---

## 5. Rendimiento y carga — `apps/backend/bench/` (ts-node, manual)

### 5.1 Motor — `bench/actuarial.bench.ts`

Mide tiempo de simulación, delta de heap y ticks perdidos (sync y async):

| nSimulaciones | Sync | Async (TAMANO_LOTE=5000) |
|---|---|---|
| 1.000 | ~34 ms | ~34 ms |
| 10.000 (default) | ~108 ms | ~108 ms |
| 25.000 (máx.) | ~400 ms | ~400 ms |

Async no es más rápido — ceder el event loop agrega overhead mínimo pero **evita bloqueo**.

### 5.2 Concurrencia — `bench/concurrencia.bench.ts`

5 requests a `N = 25.000` en paralelo contra la app Nest in-process. Las peticiones se serializan en el event loop (confirmado empíricamente).

---

## 6. Herramientas y decisiones

| Decisión | Detalle |
|---|---|
| **fast-check** (devDep de shared) | Tests de propiedades con miles de combinaciones aleatorias. |
| **vitest fake timers** en frontend | `vi.useFakeTimers({ shouldAdvanceTime: true })` permite flush del `setTimeout(0)` del componente y del chunking interno de `simularRiesgoAsync` sin depender de `zone.js/testing`. |
| **sync preservado para tests** | `simularRiesgo` (sync) se mantiene para tests unitarios de dominio; `simularRiesgoAsync` se usa en producción. |
| **mock con `percentiles: {}`** | Testea el fallback `??` del persistencia service sin necesidad de mockear Prisma con percentiles parciales. |
| **Bench fuera de CI** | `test:rendimiento` es manual; resultados documentados, no enforceados. |

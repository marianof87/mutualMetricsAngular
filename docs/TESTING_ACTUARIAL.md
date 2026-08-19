# Testing del Módulo Actuarial — Metrix AI

Registro de los tests llevados a cabo sobre el módulo actuarial (Monte Carlo sobre
`G(P) = A·P² + B·P + C`), rama `feature/cuadratica/actuarial`. Complementa `docs/MODULO_ACTUARIAL.md` §5.

## 1. Estado general

| Suites | Tests | Resultado |
|---|---|---|
| Shared (`packages/shared`) — vitest | 97 | ✅ verdes |
| Backend (`apps/backend`) — jest + supertest | 28 | ✅ verdes |
| Frontend (`apps/frontend`) — vitest + jsdom | 32 | ✅ verdes |
| Rendimiento (`apps/backend/bench`) — ts-node | — | ✅ corre (no va en CI) |

Ejecución:

```bash
npm test --workspace=@mutual-metrics/shared
npm test --workspace=@mutual-metrics/backend
npm test --workspace=@mutual-metrics/frontend -- --watch=false
npm run test:rendimiento --workspace=@mutual-metrics/backend   # manual, no CI
```

## 2. Lógica de dominio y matemática (shared, vitest)

### 2.1 Distribuciones — `dominio/actuarial/distribuciones.test.ts`
- RNG `mulberry32`: determinista (misma semilla ⇒ misma secuencia), semillas distintas ⇒ secuencias distintas, salida en `[0, 1)`.
- Uniforme: valores en rango, media cerca del centro.
- Triangular: valores en `[min, max]`, media empírica converge a `(min + moda + max)/3` y al caso de moda desplazada `(min + 2·moda)/3`, parámetro degenerado (`min = moda = max`) devuelve siempre el valor.
- Normal truncada: nunca sale del rango, media cerca del centro, desvío acotado por el ancho del rango.
- Cuantil normal (Acklam): valores clásicos y monotonía creciente.

### 2.2 Estadística — `dominio/actuarial/estadistica.test.ts`
- Percentil R-7: valor central en arreglo impar, interpolación entre contiguos, extremos en P0/P100, independencia del orden de entrada.
- Media aritmética y desvío estándar muestral.
- Redondeo a dos decimales.

### 2.3 Motor Monte Carlo — `dominio/actuarial/monteCarlo.test.ts`
- **Caso determinístico exacto** (todo fijo): vértice en `P=30` con ganancia `800`, piso de equilibrio = raíz menor de la parábola (`10`), curva de riesgo escalón 0/1 dentro/fuera de las raíces, `precioActual` ubicado en la curva.
- **Reproducibilidad**: misma semilla ⇒ respuesta idéntica (deep equal); semillas distintas ⇒ respuestas distintas.
- **Con incertidumbre chica**: la media del precio óptimo converge a `-B/(2·E[A]) = 30` y la ganancia a `800`.
- **Probabilidad de pérdida** calculada a mano con tolerancia sobre el valor teórico.
- **Sin piso solvente** para el nivel de confianza: `pisoSolvencia: null` + advertencia.
- **Muestras degeneradas** (`A ≥ 0`): se descartan, se cuentan en `muestrasInvalidas` y generan advertencia (caso total y minoría).
- **Invariantes de la respuesta**: `P5 ≤ P50 ≤ P95` y `intervalo.minimo ≤ intervalo.maximo` en todos los resúmenes; probabilidad de pérdida (óptimo, actual y curva) en `[0, 1]`; `muestrasInvalidas` entero ≥ 0; sin NaN/infinitos en ningún campo numérico; `pisoSolvencia` `null` o ≥ 0.
- **`tieneIncertidumbre`**: falso con A/C fijos y B numérico; verdadero con A triangular, con C normal, y con B estocástico aunque A y C sean fijos (escenario futuro de v2, probado con cast).

### 2.4 Schemas Zod — `dtos/actuarial.test.ts`
- Acepta solicitud completa válida y respuesta completa (con y sin piso/precio actual).
- Defaults: `nSimulaciones` → 10.000, `nivelConfianza` → 0.95, confianza del parámetro normal → 0.9.
- Rechazos: `minimo >= maximo`, `moda` fuera de `[min, max]`, precios negativos, `nSimulaciones` fuera de `[100, 100.000]`, `nivelConfianza` fuera de `[0.8, 0.99]`, semilla no entera o negativa, tipo de parámetro desconocido.

### 2.5 Property-based — `dominio/actuarial/propiedadesActuarial.test.ts` (fast-check)
- **Invariantes sobre solicitudes aleatorias** (300 corridas, arbitrario que genera A/C fijo/triangular/normal con rangos coherentes, B, precios y confianza aleatorios): nunca lanza; sin NaN/infinitos; percentiles ordenados; probabilidad en `[0, 1]`; `muestrasInvalidas` entero ≥ 0; curva de riesgo de 50 puntos; `pisoSolvencia` coherente; advertencias siempre array.
- **Muestreos dentro de rango** (200 corridas c/u): triangular y normal truncada nunca salen de `[min, max]`; parámetro fijo devuelve siempre su valor.
- Detalle técnico: `fc.float` puede generar NaN como caso límite; se reemplazó por entero mapeado a centésimos (`fc.integer({min:80, max:99}).map(n => n/100)`).

## 3. Reglas de negocio y API (backend, jest + supertest)

### 3.1 Servicio — `modules/actuarial/actuarial.service.spec.ts`
- Solicitud sin incertidumbre (A y C fijos) → `400 SIMULACION_SIN_INCERTIDUMBRE` (envelope).
- Con incertidumbre → delega en el dominio y devuelve la simulación completa.
- A y C fijos con **B estocástico** → **no** lanza (preparado para v2).
- `traducirErrorDominio`: `RangeError` del motor → `422 ENTRADA_INVALIDA` con su mensaje; cualquier otra excepción se re-lanza para el filtro global.

### 3.2 Integración HTTP — `modules/actuarial/actuarial.controller.spec.ts` (supertest)
- `POST /actuarial/simulaciones` con request válida → `200` y el body validado contra `SimulacionActuarialResponseSchema`.
- **Reproducibilidad a nivel HTTP**: dos requests con la misma semilla devuelven respuestas idénticas.
- `minimo > maximo` → `400 ENTRADA_INVALIDA` con mensaje en español.
- Precios negativos → `400 ENTRADA_INVALIDA`.
- `nSimulaciones` fuera de rango → `400 ENTRADA_INVALIDA`.
- Sin incertidumbre → `400 SIMULACION_SIN_INCERTIDUMBRE`.
- Caso degenerado total (`A` normal en `[0, 1]`) → `200` con `muestrasInvalidas = n` y advertencia "Ningún escenario fue aprovechable".
- Unitario del controller: delega en el servicio mockeado y devuelve el resultado.

## 4. Frontend (vitest + jsdom, `@angular/build:unit-test`)

### 4.1 Servicio — `features/actuarial/actuarial.service.spec.ts`
- `simular()` hace `POST` a `${entorno.apiBaseUrl}/actuarial/simulaciones` con el body exacto de la solicitud (verificado con `HttpTestingController`, flush de una respuesta completa).

### 4.2 Componente — `features/actuarial/actuarial.component.spec.ts`
- Render inicial: título, panel "Esperando simulación", botón habilitado con valores por defecto.
- Sin incertidumbre (A y C fijos): botón deshabilitado + mensaje "Al menos un coeficiente debe ser estocástico".
- `simular()` no llama al servicio sin incertidumbre.
- Envía el request construido desde las señales (parámetros, semilla, `precioActual` opcional) y renderiza: media del precio óptimo, intervalo, "Sin piso solvente", chips de percentiles, advertencias, hint con semilla y descartadas.
- Error del envelope (`error.error.message`) → mensaje en pantalla, `cargando` vuelve a false, sin crashear.
- `percentilesDe()` mapea claves/valores correctamente.
- Patrón de gráfico: stub de `canvas[baseChart]` (jsdom no implementa canvas 2D).

### 4.3 Ajuste derivado — `shared/navbar/navbar.spec.ts`
- El link "Módulo Actuarial" agregado al navbar rompía la aserción de secciones del spec existente; se actualizó la lista esperada.

## 5. Rendimiento y carga — `apps/backend/bench/` (ts-node, manual)

### 5.1 Motor — `bench/actuarial.bench.ts`
Mide tiempo de simulación (bloqueo del event loop), delta de heap y ticks de `setInterval` perdidos:

| nSimulaciones | Tiempo | Ticks perdidos |
|---|---|---|
| 1.000 | ~34 ms | ~34 |
| 10.000 (default) | ~108 ms | ~108 |
| 50.000 | ~391 ms | ~391 |
| 100.000 (máx.) | ~851 ms | ~851 |

Ticks perdidos ≈ duración ⇒ el event loop no atiende nada durante la simulación (motor síncrono, esperado y documentado en `MODULO_ACTUARIAL.md` §6.1).

### 5.2 Concurrencia — `bench/concurrencia.bench.ts`
5 requests a `N = 100.000` en paralelo contra la app Nest in-process:

- Total: **5.703 ms** · p95 por request: **5.701 ms** · heap: **+267 MB** · respuestas válidas: sí.
- Conclusión empírica: las peticiones se **serializan** en el event loop (no se superponen). Refuerza la decisión de mantener el cálculo síncrono para el perfil actual y deja el async por lotes como upgrade barato si hubiera carga.

## 6. Herramientas y decisiones

| Decisión | Detalle |
|---|---|
| **fast-check** agregado (devDep de shared) | Única dependencia nueva; habilita los tests de propiedades (miles de combinaciones) sin infraestructura adicional. |
| **Playwright postergado** | Los specs del componente + la integración HTTP cubren la misma superficie; anotado en `MODULO_ACTUARIAL.md` §7. |
| **k6/Artillery descartados** | Scripts Node con supertest in-process cubren bloqueo y concurrencia sin herramientas externas. |
| **Envelope de error** | Los 400/422 de la API se verifican con los códigos del envelope (`ENTRADA_INVALIDA`, `SIMULACION_SIN_INCERTIDUMBRE`), no parseando mensajes. |
| **Bench fuera de CI** | `test:rendimiento` es manual; los resultados se documentan, no se enforcean. |
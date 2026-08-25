import { describe, it, expect } from 'vitest';
import { simularRiesgo, simularRiesgoAsync, tieneIncertidumbre } from './monteCarlo';
import type { SimulacionActuarialRequest } from '../../dtos/actuarial';

describe('simularRiesgo — caso determinístico (todo fijo)', () => {
  const solicitud: SimulacionActuarialRequest = {
    coeficienteA: { tipo: 'fijo', valor: -2 },
    coeficienteB: { tipo: 'fijo', valor: 120 },
    coeficienteC: { tipo: 'fijo', valor: -1000 },
    precioMinimo: 10,
    precioMaximo: 100,
    precioActual: 30,
    nSimulaciones: 500,
    nivelConfianza: 0.95,
    semilla: 5,
  };

  it('reproduce la solución exacta de la parábola (vértice en P=30, ganancia 800)', () => {
    const resultado = simularRiesgo(solicitud);
    expect(resultado.precioOptimo.media).toBe(30);
    expect(resultado.precioOptimo.intervalo).toEqual({ minimo: 30, maximo: 30 });
    expect(resultado.gananciaMaxima.media).toBe(800);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBe(0);
    expect(resultado.probabilidadPerdida.enPrecioActual).toBe(0);
  });

  it('calcula el piso de equilibrio exacto (raíz menor de P² - 60P + 500 = 0 → 10)', () => {
    const resultado = simularRiesgo(solicitud);
    expect(resultado.puntoEquilibrio.media).toBe(10);
    expect(resultado.pisoSolvencia).toBe(10);
  });

  it('la curva de riesgo es 0 dentro de las raíces y 1 fuera de ellas', () => {
    const resultado = simularRiesgo(solicitud);
    // G(P) >= 0 para P en [10, 50]; el grid va de 10 a 100 en 50 puntos (paso 90/49).
    for (let indice = 0; indice <= 21; indice++) {
      expect(resultado.curvaRiesgo[indice].probabilidadPerdida).toBe(0);
    }
    for (let indice = 22; indice < 50; indice++) {
      expect(resultado.curvaRiesgo[indice].probabilidadPerdida).toBe(1);
    }
  });

  it('reporta el precio actual dentro de la curva de riesgo cuando viene en la solicitud', () => {
    const resultado = simularRiesgo({ ...solicitud, precioActual: 100 });
    expect(resultado.probabilidadPerdida.enPrecioActual).toBe(1);
  });
});

describe('simularRiesgo — reproducibilidad', () => {
  it('la misma semilla produce exactamente la misma respuesta', () => {
    const base: SimulacionActuarialRequest = {
      coeficienteA: { tipo: 'triangular', minimo: -2.05, moda: -2, maximo: -1.95 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'triangular', minimo: -1050, moda: -1000, maximo: -950 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 20000,
      nivelConfianza: 0.95,
      semilla: 42,
    };
    const primera = simularRiesgo(base);
    const segunda = simularRiesgo(base);
    expect(primera).toEqual(segunda);
  });

  it('semillas distintas producen respuestas distintas', () => {
    const base: SimulacionActuarialRequest = {
      coeficienteA: { tipo: 'triangular', minimo: -2.05, moda: -2, maximo: -1.95 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'triangular', minimo: -1050, moda: -1000, maximo: -950 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 20000,
      nivelConfianza: 0.95,
      semilla: 42,
    };
    const conCuarentaYDos = simularRiesgo(base);
    const conCuarentaYTres = simularRiesgo({ ...base, semilla: 43 });
    expect(JSON.stringify(conCuarentaYDos)).not.toBe(JSON.stringify(conCuarentaYTres));
  });
});

describe('simularRiesgo — Monte Carlo con incertidumbre chica', () => {
  it('la media del precio óptimo converge a -B/(2·E[A]) = 30 y la ganancia a 800', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -2.05, moda: -2, maximo: -1.95 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'triangular', minimo: -1050, moda: -1000, maximo: -950 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 20000,
      nivelConfianza: 0.95,
      semilla: 42,
    });
    expect(Math.abs(resultado.precioOptimo.media - 30)).toBeLessThan(1);
    expect(resultado.gananciaMaxima.media).toBeGreaterThan(740);
    expect(resultado.gananciaMaxima.media).toBeLessThan(860);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBe(0);
    expect(resultado.pisoSolvencia).not.toBeNull();
    expect(resultado.pisoSolvencia!).toBeGreaterThan(8);
    expect(resultado.pisoSolvencia!).toBeLessThan(16);
    expect(resultado.advertencias).toEqual([]);
  });
});

describe('simularRiesgo — probabilidad de pérdida calculada a mano', () => {
  // G(p*) = c - b²/(4a) < 0 ⇔ a > -2500/900 ≈ -2.7778. Con A ~ Tri(-4, -3, -2):
  // P(pérdida) = P(A < -2.7778) = 1 - (max - p)² / ((max-min)·(max-moda)) ≈ 0.6975.
  it('estima la probabilidad de pérdida con tolerancia sobre el valor teórico', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -4, moda: -3, maximo: -2 },
      coeficienteB: { tipo: 'fijo', valor: 100 },
      coeficienteC: { tipo: 'fijo', valor: -900 },
      precioMinimo: 5,
      precioMaximo: 40,
      nSimulaciones: 30000,
      nivelConfianza: 0.95,
      semilla: 7,
    });
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeGreaterThan(0.64);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeLessThan(0.76);
  });

  it('sin piso solvente para el nivel de confianza, reporta null y advierte', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -4, moda: -3, maximo: -2 },
      coeficienteB: { tipo: 'fijo', valor: 100 },
      coeficienteC: { tipo: 'fijo', valor: -900 },
      precioMinimo: 5,
      precioMaximo: 40,
      nSimulaciones: 30000,
      nivelConfianza: 0.95,
      semilla: 7,
    });
    expect(resultado.pisoSolvencia).toBeNull();
    expect(
      resultado.advertencias.some((advertencia) =>
        advertencia.includes('no existe precio que cubra los costos'),
      ),
    ).toBe(true);
    expect(resultado.curvaRiesgo[0].probabilidadPerdida).toBe(1);
    expect(resultado.curvaRiesgo[49].probabilidadPerdida).toBe(1);
  });
});

describe('simularRiesgo — muestras degeneradas', () => {
  it('descarta escenarios con A >= 0, los cuenta y advierte', () => {
    const resultado = simularRiesgo({
      // Rango 100% inválido: sensibilidad positiva en todo el rango.
      coeficienteA: { tipo: 'triangular', minimo: 1, moda: 2, maximo: 3 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 1000,
      nivelConfianza: 0.95,
      semilla: 3,
    });
    expect(resultado.muestrasInvalidas).toBe(1000);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBe(0);
    expect(resultado.advertencias[0]).toContain('Ningún escenario fue aprovechable');
  });

  it('con una minoría de escenarios degenerados, genera la advertencia de descarte', () => {
    const resultado = simularRiesgo({
      // La cola positiva (A > 0) existe con baja probabilidad: 0.1^3-ish dentro de la triangular.
      coeficienteA: { tipo: 'triangular', minimo: -0.02, moda: -0.01, maximo: 0.02 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 30000,
      nivelConfianza: 0.95,
      semilla: 11,
    });
    expect(resultado.muestrasInvalidas).toBeGreaterThan(0);
    expect(
      resultado.advertencias.some((advertencia) => advertencia.includes('Se descartó el')),
    ).toBe(true);
  });
});

describe('tieneIncertidumbre', () => {
  it('es falso cuando todos los coeficientes son fijos (incluido B numérico)', () => {
    expect(
      tieneIncertidumbre({
        coeficienteA: { tipo: 'fijo', valor: -2 },
        coeficienteB: { tipo: 'fijo', valor: 120 },
        coeficienteC: { tipo: 'fijo', valor: -1000 },
        precioMinimo: 10,
        precioMaximo: 100,
        nSimulaciones: 500,
        nivelConfianza: 0.95,
      }),
    ).toBe(false);
  });

  it('es verdadero con A estocástico y C fijo', () => {
    expect(
      tieneIncertidumbre({
        coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
        coeficienteB: { tipo: 'fijo', valor: 120 },
        coeficienteC: { tipo: 'fijo', valor: -1000 },
        precioMinimo: 10,
        precioMaximo: 100,
        nSimulaciones: 500,
        nivelConfianza: 0.95,
      }),
    ).toBe(true);
  });

  it('es verdadero con A fijo y C normal', () => {
    expect(
      tieneIncertidumbre({
        coeficienteA: { tipo: 'fijo', valor: -2 },
        coeficienteB: { tipo: 'fijo', valor: 120 },
        coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
        precioMinimo: 10,
        precioMaximo: 100,
        nSimulaciones: 500,
        nivelConfianza: 0.95,
      }),
    ).toBe(true);
  });

  it('es verdadero si B llegara a ser estocástico aunque A y C sean fijos', () => {
    expect(
      tieneIncertidumbre({
        coeficienteA: { tipo: 'fijo', valor: -2 },
        coeficienteB: { tipo: 'triangular', minimo: 100, moda: 120, maximo: 140 },
        coeficienteC: { tipo: 'fijo', valor: -1000 },
        precioMinimo: 10,
        precioMaximo: 100,
        nSimulaciones: 500,
        nivelConfianza: 0.95,
      }),
    ).toBe(true);
  });
});

describe('simularRiesgo — invariantes de la respuesta', () => {
  it('cumple P5 <= P50 <= P95 en los resúmenes de distribución', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 20000,
      nivelConfianza: 0.95,
      semilla: 21,
    });

    for (const resumen of [resultado.precioOptimo, resultado.gananciaMaxima]) {
      const p5 = resumen.percentiles['5'];
      const p50 = resumen.percentiles['50'];
      const p95 = resumen.percentiles['95'];
      expect(p5).toBeLessThanOrEqual(p50);
      expect(p50).toBeLessThanOrEqual(p95);
      expect(resumen.intervalo.minimo).toBeLessThanOrEqual(resumen.intervalo.maximo);
    }
  });

  it('mantiene la probabilidad de pérdida en [0, 1] y muestrasInvalidas como entero >= 0', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -0.02, moda: -0.01, maximo: 0.02 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      precioActual: 15,
      nSimulaciones: 30000,
      nivelConfianza: 0.95,
      semilla: 22,
    });

    expect(Number.isInteger(resultado.muestrasInvalidas)).toBe(true);
    expect(resultado.muestrasInvalidas).toBeGreaterThanOrEqual(0);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeGreaterThanOrEqual(0);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeLessThanOrEqual(1);
    if (resultado.probabilidadPerdida.enPrecioActual !== null) {
      expect(resultado.probabilidadPerdida.enPrecioActual).toBeGreaterThanOrEqual(0);
      expect(resultado.probabilidadPerdida.enPrecioActual).toBeLessThanOrEqual(1);
    }
    for (const punto of resultado.curvaRiesgo) {
      expect(punto.probabilidadPerdida).toBeGreaterThanOrEqual(0);
      expect(punto.probabilidadPerdida).toBeLessThanOrEqual(1);
    }
  });

  it('no produce NaN ni infinitos en ningún campo numérico', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'normal', minimo: -5, maximo: -0.5, nivelConfianza: 0.9 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'triangular', minimo: -2000, moda: -1000, maximo: -500 },
      precioMinimo: 5,
      precioMaximo: 200,
      precioActual: 40,
      nSimulaciones: 20000,
      nivelConfianza: 0.9,
      semilla: 23,
    });

    const numericos = [
      resultado.precioOptimo.media,
      resultado.precioOptimo.mediana,
      resultado.precioOptimo.desvio,
      ...Object.values(resultado.precioOptimo.percentiles),
      resultado.precioOptimo.intervalo.minimo,
      resultado.precioOptimo.intervalo.maximo,
      resultado.pisoSolvencia,
      resultado.probabilidadPerdida.enPrecioOptimo,
      ...resultado.curvaRiesgo.flatMap((punto) => [punto.precio, punto.probabilidadPerdida]),
    ];
    for (const valor of numericos) {
      if (valor === null) continue;
      expect(Number.isFinite(valor)).toBe(true);
    }
  });

  it('reporta pisoSolvencia como null o un número no negativo', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 20000,
      nivelConfianza: 0.95,
      semilla: 24,
    });

    expect(resultado.pisoSolvencia === null || resultado.pisoSolvencia >= 0).toBe(true);
  });
});

describe('simularRiesgo — B estocástico en el motor', () => {
  it('produce resultados válidos con B triangular', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'triangular', minimo: 80, moda: 120, maximo: 160 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 10000,
      nivelConfianza: 0.95,
      semilla: 42,
    });

    expect(Number.isFinite(resultado.precioOptimo.media)).toBe(true);
    expect(resultado.precioOptimo.media).toBeGreaterThan(0);
    expect(resultado.gananciaMaxima.media).toBeGreaterThan(0);
    expect(resultado.curvaRiesgo.length).toBe(50);
    expect(Number.isInteger(resultado.muestrasInvalidas)).toBe(true);
    expect(resultado.muestrasInvalidas).toBeGreaterThanOrEqual(0);
  });

  it('produce resultados distintos a B fijo', () => {
    const base: SimulacionActuarialRequest = {
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 10000,
      nivelConfianza: 0.95,
      semilla: 42,
    };

    const conBFijo = simularRiesgo(base);
    const conBTriangular = simularRiesgo({
      ...base,
      coeficienteB: { tipo: 'triangular', minimo: 80, moda: 120, maximo: 160 },
    });

    expect(conBFijo.precioOptimo.media).not.toBe(conBTriangular.precioOptimo.media);
  });

  it('mantiene invariantes con B estocástico (sin NaN, percentiles ordenados)', () => {
    const resultado = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'normal', minimo: 80, maximo: 160, nivelConfianza: 0.9 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 10000,
      nivelConfianza: 0.95,
      semilla: 77,
    });

    expect(Number.isFinite(resultado.precioOptimo.media)).toBe(true);
    const p5 = resultado.precioOptimo.percentiles['5'];
    const p50 = resultado.precioOptimo.percentiles['50'];
    const p95 = resultado.precioOptimo.percentiles['95'];
    expect(p5).toBeLessThanOrEqual(p50);
    expect(p50).toBeLessThanOrEqual(p95);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeGreaterThanOrEqual(0);
    expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeLessThanOrEqual(1);
  });
});

describe('simularRiesgoAsync — boundaries de chunking', () => {
  it('funciona con nSimulaciones igual al tamaño de lote (5000)', async () => {
    const resultado = await simularRiesgoAsync({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 5000,
      nivelConfianza: 0.95,
      semilla: 10,
    });

    const sync = simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 5000,
      nivelConfianza: 0.95,
      semilla: 10,
    });

    expect(resultado).toEqual(sync);
  });

  it('funciona con nSimulaciones menor al tamaño de lote (100)', async () => {
    const resultado = await simularRiesgoAsync({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 100,
      nivelConfianza: 0.95,
      semilla: 5,
    });

    expect(Number.isFinite(resultado.precioOptimo.media)).toBe(true);
    expect(resultado.curvaRiesgo.length).toBe(50);
  });

  it('produce exactamente la misma respuesta que simularRiesgo para n=100', async () => {
    const solicitud: SimulacionActuarialRequest = {
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 100,
      nivelConfianza: 0.95,
      semilla: 5,
    };
    const sync = simularRiesgo(solicitud);
    const async_ = await simularRiesgoAsync(solicitud);
    expect(async_).toEqual(sync);
  });
});

describe('simularRiesgoAsync — equivalencia con la versión síncrona', () => {
  const solicitud: SimulacionActuarialRequest = {
    coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
    coeficienteB: { tipo: 'fijo', valor: 120 },
    coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
    precioMinimo: 10,
    precioMaximo: 100,
    nSimulaciones: 10000,
    nivelConfianza: 0.95,
    semilla: 42,
  };

  it('produce exactamente la misma respuesta que simularRiesgo para la misma semilla', async () => {
    const sync = simularRiesgo(solicitud);
    const async_ = await simularRiesgoAsync(solicitud);
    expect(async_).toEqual(sync);
  });

  it('mantiene invariantes de la respuesta (sin NaN, percentiles ordenados)', async () => {
    const resultado = await simularRiesgoAsync({
      ...solicitud,
      nSimulaciones: 15000,
      semilla: 99,
    });

    expect(Number.isFinite(resultado.precioOptimo.media)).toBe(true);
    const p5 = resultado.precioOptimo.percentiles['5'];
    const p50 = resultado.precioOptimo.percentiles['50'];
    const p95 = resultado.precioOptimo.percentiles['95'];
    expect(p5).toBeLessThanOrEqual(p50);
    expect(p50).toBeLessThanOrEqual(p95);
    expect(resultado.curvaRiesgo.length).toBe(50);
  });
});
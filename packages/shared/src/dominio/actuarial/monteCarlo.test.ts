import { describe, it, expect } from 'vitest';
import { simularRiesgo } from './monteCarlo';
import type { SimulacionActuarialRequest } from '../../dtos/actuarial';

describe('simularRiesgo — caso determinístico (todo fijo)', () => {
  const solicitud: SimulacionActuarialRequest = {
    coeficienteA: { tipo: 'fijo', valor: -2 },
    coeficienteB: 120,
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
      coeficienteB: 120,
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
      coeficienteB: 120,
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
      coeficienteB: 120,
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
      coeficienteB: 100,
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
      coeficienteB: 100,
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
      coeficienteB: 120,
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
      coeficienteB: 120,
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
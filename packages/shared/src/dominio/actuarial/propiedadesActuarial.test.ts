import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { crearAleatorio, muestrearParametro } from './distribuciones';
import { simularRiesgo } from './monteCarlo';
import type { ParametroEstocastico, SimulacionActuarialRequest } from '../../dtos/actuarial';

const arbitrarioTriangular = fc.record({
  tipo: fc.constant('triangular' as const),
  minimo: fc.integer({ min: -10_000, max: -2 }),
  moda: fc.integer({ min: -10_000, max: -2 }),
  maximo: fc.integer({ min: -10_000, max: -2 }),
}).map((p) => {
  const [minimo, moda, maximo] = [p.minimo, p.moda, p.maximo].sort((a, b) => a - b);
  return { tipo: 'triangular' as const, minimo, moda, maximo };
});

const arbitrarioNormal = fc.record({
  tipo: fc.constant('normal' as const),
  minimo: fc.integer({ min: -10_000, max: -2 }),
  maximo: fc.integer({ min: -10_000, max: -2 }),
}).map((p) => ({
  tipo: 'normal' as const,
  minimo: Math.min(p.minimo, p.maximo),
  maximo: Math.max(p.minimo, p.maximo),
  nivelConfianza: 0.9,
}));

const arbitrarioPert = fc.record({
  tipo: fc.constant('pert' as const),
  minimo: fc.integer({ min: -10_000, max: -2 }),
  moda: fc.integer({ min: -10_000, max: -2 }),
  maximo: fc.integer({ min: -10_000, max: -2 }),
}).map((p) => {
  const [minimo, moda, maximo] = [p.minimo, p.moda, p.maximo].sort((a, b) => a - b);
  return { tipo: 'pert' as const, minimo, moda, maximo };
});

const arbitrarioEstocastico = fc.oneof(
  fc.record({ tipo: fc.constant('fijo' as const), valor: fc.integer({ min: -10_000, max: -1 }) }),
  arbitrarioTriangular,
  arbitrarioNormal,
  arbitrarioPert,
);

const arbitrarioSolicitud: fc.Arbitrary<SimulacionActuarialRequest> = fc
  .tuple(
    arbitrarioEstocastico,
    arbitrarioEstocastico,
    arbitrarioEstocastico,
    fc.integer({ min: 1, max: 50 }),
    fc.integer({ min: 51, max: 500 }),
    fc.integer({ min: 80, max: 99 }).map((centesimos) => centesimos / 100),
  )
  .map(
    ([coeficienteA, coeficienteB, coeficienteC, precioMinimo, precioMaximo, nivelConfianza]) => ({
      coeficienteA: coeficienteA as ParametroEstocastico,
      coeficienteB: coeficienteB as ParametroEstocastico,
      coeficienteC: coeficienteC as ParametroEstocastico,
      precioMinimo,
      precioMaximo,
      nSimulaciones: 300,
      nivelConfianza,
      semilla: 42,
    }),
  );

describe('simularRiesgo — propiedades invariantes (fast-check)', () => {
  it('nunca lanza ni produce NaN/infinitos y mantiene las invariantes de salida', () => {
    fc.assert(
      fc.property(arbitrarioSolicitud, (solicitud) => {
        const resultado = simularRiesgo(solicitud);

        expect(Number.isInteger(resultado.muestrasInvalidas)).toBe(true);
        expect(resultado.muestrasInvalidas).toBeGreaterThanOrEqual(0);

        for (const resumen of [resultado.precioOptimo, resultado.gananciaMaxima]) {
          const p5 = resumen.percentiles['5'];
          const p50 = resumen.percentiles['50'];
          const p95 = resumen.percentiles['95'];
          expect(p5).toBeLessThanOrEqual(p50);
          expect(p50).toBeLessThanOrEqual(p95);
          expect(resumen.intervalo.minimo).toBeLessThanOrEqual(resumen.intervalo.maximo);
          expect(Number.isFinite(resumen.media)).toBe(true);
          expect(Number.isFinite(resumen.desvio)).toBe(true);
        }

        expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeGreaterThanOrEqual(0);
        expect(resultado.probabilidadPerdida.enPrecioOptimo).toBeLessThanOrEqual(1);

        expect(resultado.curvaRiesgo.length).toBe(50);
        for (const punto of resultado.curvaRiesgo) {
          expect(Number.isFinite(punto.precio)).toBe(true);
          expect(punto.probabilidadPerdida).toBeGreaterThanOrEqual(0);
          expect(punto.probabilidadPerdida).toBeLessThanOrEqual(1);
        }

        expect(resultado.pisoSolvencia === null || resultado.pisoSolvencia >= 0).toBe(true);
        expect(Array.isArray(resultado.advertencias)).toBe(true);
      }),
      { numRuns: 300, verbose: false },
    );
  });
});

describe('muestrearParametro — propiedades de rango (fast-check)', () => {
  it('todo muestreo triangular cae dentro de [minimo, maximo]', () => {
    fc.assert(
      fc.property(arbitrarioTriangular, (parametro) => {
        const aleatorio = crearAleatorio(7);
        for (let i = 0; i < 20; i++) {
          const valor = muestrearParametro(aleatorio, parametro);
          expect(valor).toBeGreaterThanOrEqual(parametro.minimo);
          expect(valor).toBeLessThanOrEqual(parametro.maximo);
          expect(Number.isFinite(valor)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('todo muestreo normal truncado cae dentro de [minimo, maximo]', () => {
    fc.assert(
      fc.property(arbitrarioNormal, (parametro) => {
        const aleatorio = crearAleatorio(11);
        for (let i = 0; i < 20; i++) {
          const valor = muestrearParametro(aleatorio, parametro);
          expect(valor).toBeGreaterThanOrEqual(parametro.minimo);
          expect(valor).toBeLessThanOrEqual(parametro.maximo);
          expect(Number.isFinite(valor)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('todo muestreo pert cae dentro de [minimo, maximo]', () => {
    fc.assert(
      fc.property(arbitrarioPert, (parametro) => {
        const aleatorio = crearAleatorio(13);
        for (let i = 0; i < 20; i++) {
          const valor = muestrearParametro(aleatorio, parametro);
          expect(valor).toBeGreaterThanOrEqual(parametro.minimo);
          expect(valor).toBeLessThanOrEqual(parametro.maximo);
          expect(Number.isFinite(valor)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('un parámetro fijo devuelve siempre su valor', () => {
    fc.assert(
      fc.property(fc.integer({ min: -10_000, max: -1 }), (valor) => {
        const aleatorio = crearAleatorio(3);
        const parametro: ParametroEstocastico = { tipo: 'fijo', valor };
        for (let i = 0; i < 20; i++) {
          expect(muestrearParametro(aleatorio, parametro)).toBe(valor);
        }
      }),
      { numRuns: 200 },
    );
  });
});
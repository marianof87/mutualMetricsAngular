import { describe, it, expect } from 'vitest';
import {
  calcularInteresSimple,
  calcularInteresCompuesto,
  calcularROI,
  calcularVAN,
  calcularTIR,
} from './calculos';

describe('calcularInteresSimple', () => {
  it('calcula interés y total con la fórmula I = P·t·n', () => {
    expect(calcularInteresSimple(1000, 0.05, 2)).toEqual({ interes: 100, total: 1100 });
  });

  it('devuelve interés 0 cuando el tiempo es 0', () => {
    expect(calcularInteresSimple(1000, 0.05, 0)).toEqual({ interes: 0, total: 1000 });
  });
});

describe('calcularInteresCompuesto', () => {
  it('capitaliza anualmente por defecto (frecuencia = 1)', () => {
    const { interes, total } = calcularInteresCompuesto(1000, 0.1, 2);
    expect(total).toBeCloseTo(1210, 6);
    expect(interes).toBeCloseTo(210, 6);
  });

  it('rinde más que el interés simple a igualdad de parámetros', () => {
    const simple = calcularInteresSimple(1000, 0.1, 5).total;
    const compuesto = calcularInteresCompuesto(1000, 0.1, 5).total;
    expect(compuesto).toBeGreaterThan(simple);
  });

  it('una frecuencia mayor genera más interés', () => {
    const anual = calcularInteresCompuesto(1000, 0.12, 1, 1).total;
    const mensual = calcularInteresCompuesto(1000, 0.12, 1, 12).total;
    expect(mensual).toBeGreaterThan(anual);
  });
});

describe('calcularROI', () => {
  it('devuelve el porcentaje de retorno', () => {
    expect(calcularROI(1000, 1500)).toBe(50);
  });

  it('devuelve negativo ante una pérdida', () => {
    expect(calcularROI(1000, 800)).toBe(-20);
  });

  it('protege la división por cero devolviendo 0', () => {
    expect(calcularROI(0, 500)).toBe(0);
  });
});

describe('calcularVAN', () => {
  it('con tasa 0 es la suma simple de los flujos más la inversión', () => {
    expect(calcularVAN(0, -100, [50, 50, 50])).toBe(50);
  });

  it('descuenta los flujos futuros según la tasa', () => {
    // -1000 + 500/1.1 + 500/1.1² + 500/1.1³
    expect(calcularVAN(0.1, -1000, [500, 500, 500])).toBeCloseTo(243.43, 2);
  });

  it('sin flujos futuros devuelve la inversión inicial', () => {
    expect(calcularVAN(0.1, -1000, [])).toBe(-1000);
  });
});

describe('calcularTIR', () => {
  it('encuentra la tasa que anula el VAN en un caso de un solo flujo', () => {
    // -1000 + 1100/(1+r) = 0  →  r = 0.10
    expect(calcularTIR(-1000, [1100])).toBeCloseTo(0.1, 4);
  });

  it('la TIR hace que el VAN descontado a esa tasa sea ~0', () => {
    const tir = calcularTIR(-1000, [600, 600]);
    expect(calcularVAN(tir, -1000, [600, 600])).toBeCloseTo(0, 4);
  });
});

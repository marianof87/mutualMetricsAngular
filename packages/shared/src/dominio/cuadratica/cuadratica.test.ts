import { describe, it, expect } from 'vitest';
import { resolverCuadratica } from './cuadratica';
import { CodigoError } from '../../errores/codigos';

describe('resolverCuadratica', () => {
  it('lanza CUADRATICA_A_CERO cuando a es 0', () => {
    expect(() => resolverCuadratica(0, 2, 1)).toThrow(CodigoError.CUADRATICA_A_CERO);
    expect(() => resolverCuadratica(0, 0, 5)).toThrow(CodigoError.CUADRATICA_A_CERO);
    expect(() => resolverCuadratica(0, -3, 2)).toThrow(CodigoError.CUADRATICA_A_CERO);
  });

  it('con discriminante positivo devuelve dos raíces reales distintas que satisfacen a*x²+b*x+c≈0', () => {
    const resultado = resolverCuadratica(1, -3, 2);

    expect(resultado.discriminante).toBeCloseTo(1, 6);
    expect(resultado.tipo).toBe('dosReales');
    expect(resultado.raices).not.toBeNull();
    expect(resultado.raices).toHaveLength(2);

    const [r1, r2] = resultado.raices!;
    expect(r1).not.toBeCloseTo(r2, 6);
    expect(new Set([r1, r2].map((r) => Number(r.toFixed(6))))).toEqual(
      new Set([1, 2].map((r) => Number(r.toFixed(6)))),
    );

    for (const raiz of resultado.raices!) {
      const evaluacion = 1 * raiz * raiz + -3 * raiz + 2;
      expect(evaluacion).toBeCloseTo(0, 6);
    }
  });

  it('con discriminante cero devuelve raíz doble y tipo unaRealDoble', () => {
    const resultado = resolverCuadratica(1, 2, 1);

    expect(resultado.discriminante).toBeCloseTo(0, 6);
    expect(resultado.tipo).toBe('unaRealDoble');
    expect(resultado.raices).not.toBeNull();
    expect(resultado.raices).toHaveLength(2);
    expect(resultado.raices![0]).toBeCloseTo(-1, 6);
    expect(resultado.raices![0]).toBeCloseTo(resultado.raices![1], 6);
    expect(resultado.raices![0]).toBeCloseTo(-2 / (2 * 1), 6);
  });

  it('con discriminante negativo devuelve raices null y tipo sinRaicesReales sin lanzar error', () => {
    const resultado = resolverCuadratica(1, 0, 1);

    expect(resultado.discriminante).toBeCloseTo(-4, 6);
    expect(resultado.discriminante).toBeLessThan(0);
    expect(resultado.tipo).toBe('sinRaicesReales');
    expect(resultado.raices).toBeNull();
  });

  it('calcula el vértice como x=-b/(2a) e y=f(x)', () => {
    const a = 1;
    const b = -3;
    const c = 2;
    const resultado = resolverCuadratica(a, b, c);

    const xEsperado = -b / (2 * a);
    const yEsperado = a * xEsperado * xEsperado + b * xEsperado + c;

    expect(resultado.vertice.x).toBeCloseTo(xEsperado, 6);
    expect(resultado.vertice.x).toBeCloseTo(1.5, 6);
    expect(resultado.vertice.y).toBeCloseTo(yEsperado, 6);
    expect(resultado.vertice.y).toBeCloseTo(-0.25, 6);
  });

  it('mantiene precisión con coeficientes decimales', () => {
    const a = 0.5;
    const b = -3;
    const c = 1;
    const resultado = resolverCuadratica(a, b, c);

    expect(resultado.discriminante).toBeCloseTo(7, 6);
    expect(resultado.tipo).toBe('dosReales');
    expect(resultado.raices).not.toBeNull();

    const raizEsperada1 = 3 - Math.sqrt(7);
    const raizEsperada2 = 3 + Math.sqrt(7);

    const [r1, r2] = [...resultado.raices!].sort((x, y) => x - y);
    expect(r1).toBeCloseTo(raizEsperada1, 6);
    expect(r2).toBeCloseTo(raizEsperada2, 6);

    for (const raiz of resultado.raices!) {
      const evaluacion = a * raiz * raiz + b * raiz + c;
      expect(evaluacion).toBeCloseTo(0, 6);
    }
  });

  it('con coeficiente cuadrático negativo (a<0) resuelve correctamente', () => {
    const resultado = resolverCuadratica(-1, 0, 4);

    expect(resultado.discriminante).toBeCloseTo(16, 6);
    expect(resultado.tipo).toBe('dosReales');
    const [r1, r2] = [...resultado.raices!].sort((x, y) => x - y);
    expect(r1).toBeCloseTo(-2, 6);
    expect(r2).toBeCloseTo(2, 6);
  });

  it('con b=0 y discriminante positivo devuelve raíces simétricas', () => {
    const resultado = resolverCuadratica(1, 0, -4);

    expect(resultado.discriminante).toBeCloseTo(16, 6);
    expect(resultado.tipo).toBe('dosReales');
    const [r1, r2] = [...resultado.raices!].sort((x, y) => x - y);
    expect(r1).toBeCloseTo(-2, 6);
    expect(r2).toBeCloseTo(2, 6);
  });
});
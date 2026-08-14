import { describe, it, expect } from 'vitest';
import {
  crearAleatorio,
  muestrearTriangular,
  muestrearNormalTruncada,
  muestrearUniforme,
  cuantilNormal,
} from './distribuciones';

describe('crearAleatorio (mulberry32)', () => {
  it('es determinista: misma semilla produce la misma secuencia', () => {
    const secuenciaUno = Array.from({ length: 5 }, crearAleatorio(42));
    const secuenciaDos = Array.from({ length: 5 }, crearAleatorio(42));
    expect(secuenciaUno).toEqual(secuenciaDos);
  });

  it('semillas distintas producen secuencias distintas', () => {
    const secuenciaUno = Array.from({ length: 5 }, crearAleatorio(10));
    const secuenciaDos = Array.from({ length: 5 }, crearAleatorio(20));
    expect(secuenciaUno).not.toEqual(secuenciaDos);
  });

  it('devuelve valores en [0, 1)', () => {
    const aleatorio = crearAleatorio(1);
    for (let i = 0; i < 1000; i++) {
      const valor = aleatorio();
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    }
  });
});

describe('muestrearUniforme', () => {
  it('devuelve valores dentro del rango con la media cerca del centro', () => {
    const aleatorio = crearAleatorio(7);
    const valores = Array.from({ length: 20000 }, () => muestrearUniforme(aleatorio, 10, 30));
    const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
    expect(media).toBeCloseTo(20, 0);
    for (const valor of valores) {
      expect(valor).toBeGreaterThanOrEqual(10);
      expect(valor).toBeLessThan(30);
    }
  });
});

describe('muestrearTriangular', () => {
  it('devuelve valores dentro del rango', () => {
    const aleatorio = crearAleatorio(11);
    for (let i = 0; i < 5000; i++) {
      const valor = muestrearTriangular(aleatorio, 0, 5, 10);
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(10);
    }
  });

  it('la media empírica converge a (min + moda + max) / 3', () => {
    const aleatorio = crearAleatorio(13);
    const valores = Array.from({ length: 40000 }, () =>
      muestrearTriangular(aleatorio, -4, -3, -2),
    );
    const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
    expect(media).toBeCloseTo(-3, 1);
  });

  it('para una moda desplazada, la media empírica converge a (min + 2·moda) / 3', () => {
    const aleatorio = crearAleatorio(17);
    const valores = Array.from({ length: 40000 }, () =>
      muestrearTriangular(aleatorio, 0, 9, 10),
    );
    const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
    expect(media).toBeCloseTo((0 + 9 + 10) / 3, 1);
  });

  it('con parametro degenerado (min = moda = max) devuelve siempre ese valor', () => {
    const aleatorio = crearAleatorio(19);
    for (let i = 0; i < 100; i++) {
      expect(muestrearTriangular(aleatorio, -2, -2, -2)).toBe(-2);
    }
  });
});

describe('muestrearNormalTruncada', () => {
  it('nunca sale del rango [minimo, maximo]', () => {
    const aleatorio = crearAleatorio(23);
    for (let i = 0; i < 10000; i++) {
      const valor = muestrearNormalTruncada(aleatorio, 800, 1200, 0.9);
      expect(valor).toBeGreaterThanOrEqual(800);
      expect(valor).toBeLessThanOrEqual(1200);
    }
  });

  it('la media empírica cae cerca del centro del rango', () => {
    const aleatorio = crearAleatorio(29);
    const valores = Array.from({ length: 40000 }, () =>
      muestrearNormalTruncada(aleatorio, 800, 1200, 0.9),
    );
    const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
    expect(media).toBeCloseTo(1000, 0);
  });

  it('con un rango angosto el desvío empírico es acotado por el ancho del rango', () => {
    const aleatorio = crearAleatorio(31);
    const valores = Array.from({ length: 20000 }, () =>
      muestrearNormalTruncada(aleatorio, 90, 110, 0.9),
    );
    const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
    const desvio = Math.sqrt(
      valores.reduce((acc, v) => acc + (v - media) ** 2, 0) / (valores.length - 1),
    );
    expect(desvio).toBeLessThan(20);
    expect(desvio).toBeGreaterThan(1);
  });
});

describe('cuantilNormal', () => {
  it('devuelve los cuantiles clásicos', () => {
    expect(cuantilNormal(0.5)).toBeCloseTo(0, 6);
    expect(cuantilNormal(0.975)).toBeCloseTo(1.959964, 4);
    expect(cuantilNormal(0.95)).toBeCloseTo(1.644854, 4);
    expect(cuantilNormal(0.9)).toBeCloseTo(1.281552, 4);
  });

  it('es creciente', () => {
    expect(cuantilNormal(0.9)).toBeLessThan(cuantilNormal(0.95));
    expect(cuantilNormal(0.95)).toBeLessThan(cuantilNormal(0.99));
  });
});
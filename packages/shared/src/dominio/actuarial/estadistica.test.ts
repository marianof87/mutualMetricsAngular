import { describe, it, expect } from 'vitest';
import { calcularPercentil, calcularMedia, calcularDesvio, aDosDecimales } from './estadistica';

describe('calcularPercentil (método R-7)', () => {
  it('devuelve el valor central para el percentil 50 de un arreglo impar', () => {
    expect(calcularPercentil([1, 2, 3, 4, 5], 0.5)).toBe(3);
  });

  it('interpola entre dos valores contiguos', () => {
    // h = (4-1)*0.025 + 1 = 1.075 → 1 + 0.075*(2-1) = 1.075
    expect(calcularPercentil([1, 2, 3, 4], 0.025)).toBe(1.075);
  });

  it('respeta los extremos en percentil 0 y 100', () => {
    expect(calcularPercentil([3, 1, 5, 2, 4], 0)).toBe(1);
    expect(calcularPercentil([3, 1, 5, 2, 4], 1)).toBe(5);
  });

  it('no depende del orden de entrada', () => {
    expect(calcularPercentil([5, 3, 1, 4, 2], 0.5)).toBe(3);
  });
});

describe('calcularMedia y calcularDesvio', () => {
  it('calcula la media aritmética', () => {
    expect(calcularMedia([1, 2, 3])).toBe(2);
  });

  it('calcula el desvío estándar muestral', () => {
    // Desvío muestral de [1,2,3] = sqrt(((1-2)² + (2-2)² + (3-2)²) / 2) = 1
    expect(calcularDesvio([1, 2, 3])).toBeCloseTo(1, 10);
  });
});

describe('aDosDecimales', () => {
  it('redondea a dos decimales', () => {
    expect(aDosDecimales(2)).toBe(2);
    expect(aDosDecimales(0.1234)).toBe(0.12);
    expect(aDosDecimales(1.239)).toBe(1.24);
  });
});
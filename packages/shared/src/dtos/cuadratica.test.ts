import { describe, it, expect } from 'vitest';
import { CuadraticaRequestSchema, CuadraticaResponseSchema } from './cuadratica';

describe('CuadraticaRequestSchema', () => {
  it('acepta una request válida', () => {
    const resultado = CuadraticaRequestSchema.safeParse({ a: 1, b: -3, c: 2 });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).toEqual({ a: 1, b: -3, c: 2 });
    }
  });
});

describe('CuadraticaResponseSchema', () => {
  it('acepta una response válida con raíces reales', () => {
    const resultado = CuadraticaResponseSchema.safeParse({
      discriminante: 1,
      tipo: 'dosReales',
      raices: [1, 2],
      vertice: { x: 1.5, y: -0.25 },
    });
    expect(resultado.success).toBe(true);
  });

  it('acepta una response válida sin raíces reales con raices null', () => {
    const resultado = CuadraticaResponseSchema.safeParse({
      discriminante: -4,
      tipo: 'sinRaicesReales',
      raices: null,
      vertice: { x: 0, y: 1 },
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza tipo fuera del enum', () => {
    const resultado = CuadraticaResponseSchema.safeParse({
      discriminante: 1,
      tipo: 'tresReales',
      raices: [1, 2],
      vertice: { x: 1.5, y: -0.25 },
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza raices con longitud distinta de 2', () => {
    const conTres = CuadraticaResponseSchema.safeParse({
      discriminante: 1,
      tipo: 'dosReales',
      raices: [1, 2, 3],
      vertice: { x: 1.5, y: -0.25 },
    });
    expect(conTres.success).toBe(false);

    const conUna = CuadraticaResponseSchema.safeParse({
      discriminante: 0,
      tipo: 'unaRealDoble',
      raices: [1],
      vertice: { x: -1, y: 0 },
    });
    expect(conUna.success).toBe(false);
  });
});
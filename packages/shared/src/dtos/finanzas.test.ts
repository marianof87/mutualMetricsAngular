import { describe, it, expect } from 'vitest';
import {
  InteresSimpleRequestSchema,
  InteresCompuestoRequestSchema,
  ROIRequestSchema,
  VANRequestSchema,
  TIRRequestSchema,
} from './finanzas';

describe('InteresSimpleRequestSchema', () => {
  it('acepta un input válido', () => {
    const r = InteresSimpleRequestSchema.safeParse({ principal: 1000, tasa: 0.05, tiempo: 2 });
    expect(r.success).toBe(true);
  });

  it('rechaza un capital negativo', () => {
    const r = InteresSimpleRequestSchema.safeParse({ principal: -1, tasa: 0.05, tiempo: 2 });
    expect(r.success).toBe(false);
  });
});

describe('InteresCompuestoRequestSchema', () => {
  it('aplica frecuencia = 1 por defecto cuando se omite', () => {
    const r = InteresCompuestoRequestSchema.safeParse({ principal: 1000, tasa: 0.1, tiempo: 2 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.frecuencia).toBe(1);
  });

  it('rechaza una frecuencia menor a 1', () => {
    const r = InteresCompuestoRequestSchema.safeParse({
      principal: 1000,
      tasa: 0.1,
      tiempo: 2,
      frecuencia: 0,
    });
    expect(r.success).toBe(false);
  });
});

describe('ROIRequestSchema', () => {
  it('acepta una inversión positiva', () => {
    const r = ROIRequestSchema.safeParse({ inversion: 1000, beneficio: 1500 });
    expect(r.success).toBe(true);
  });

  it('rechaza una inversión de 0 (debe ser mayor a 0)', () => {
    const r = ROIRequestSchema.safeParse({ inversion: 0, beneficio: 1500 });
    expect(r.success).toBe(false);
  });
});

describe('VANRequestSchema', () => {
  it('acepta tasa, inversión inicial y arreglo de flujos', () => {
    const r = VANRequestSchema.safeParse({ tasa: 0.1, inversionInicial: -1000, flujos: [500, 500] });
    expect(r.success).toBe(true);
  });

  it('rechaza si flujos no es un arreglo de números', () => {
    const r = VANRequestSchema.safeParse({ tasa: 0.1, inversionInicial: -1000, flujos: ['x'] });
    expect(r.success).toBe(false);
  });
});

describe('TIRRequestSchema', () => {
  it('acepta inversión inicial y flujos', () => {
    const r = TIRRequestSchema.safeParse({ inversionInicial: -1000, flujos: [600, 600] });
    expect(r.success).toBe(true);
  });

  it('rechaza si falta el arreglo de flujos', () => {
    const r = TIRRequestSchema.safeParse({ inversionInicial: -1000 });
    expect(r.success).toBe(false);
  });
});

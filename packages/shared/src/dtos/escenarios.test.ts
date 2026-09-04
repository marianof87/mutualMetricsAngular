import { describe, it, expect } from 'vitest';
import {
  EscenarioCreateSchema,
  EscenarioSchema,
  ParametrosListadoEscenariosSchema,
  TipoEscenarioSchema,
} from './escenarios';

const idValido = '550e8400-e29b-41d4-a716-446655440000';

describe('TipoEscenarioSchema', () => {
  it('acepta los tipos de cálculo válidos', () => {
    expect(TipoEscenarioSchema.safeParse('cuadratica').success).toBe(true);
    expect(TipoEscenarioSchema.safeParse('pricing').success).toBe(true);
  });

  it('rechaza un tipo desconocido', () => {
    expect(TipoEscenarioSchema.safeParse('actuarial').success).toBe(false);
    expect(TipoEscenarioSchema.safeParse('').success).toBe(false);
  });
});

describe('EscenarioCreateSchema', () => {
  const createValido = {
    tipo: 'cuadratica' as const,
    inputs: { a: 2, b: -4, c: 2 },
    outputs: { x1: 1, x2: 1 },
  };

  it('acepta un payload de creación válido', () => {
    const resultado = EscenarioCreateSchema.safeParse(createValido);
    expect(resultado.success).toBe(true);
  });

  it('acepta inputs/outputs con estructura libre (registro)', () => {
    const resultado = EscenarioCreateSchema.safeParse({
      tipo: 'pricing',
      inputs: { precioMinimo: 10, precioMaximo: 100 },
      outputs: { precioOptimo: 55 },
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza un payload sin tipo', () => {
    const { tipo: _tipo, ...sinTipo } = createValido;
    const resultado = EscenarioCreateSchema.safeParse(sinTipo);
    expect(resultado.success).toBe(false);
  });

  it('rechaza un payload sin inputs', () => {
    const { inputs: _inputs, ...sinInputs } = createValido;
    const resultado = EscenarioCreateSchema.safeParse(sinInputs);
    expect(resultado.success).toBe(false);
  });

  it('rechaza un tipo no permitido', () => {
    const resultado = EscenarioCreateSchema.safeParse({
      ...createValido,
      tipo: 'invalido',
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza inputs que no es un objeto', () => {
    const resultado = EscenarioCreateSchema.safeParse({
      ...createValido,
      inputs: ['no', 'objeto'],
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza outputs que no es un objeto', () => {
    const resultado = EscenarioCreateSchema.safeParse({
      ...createValido,
      outputs: ['no', 'objeto'],
    });
    expect(resultado.success).toBe(false);
  });
});

describe('EscenarioSchema', () => {
  const escenarioValido = {
    id: idValido,
    tipo: 'pricing' as const,
    inputs: { precioMinimo: 10 },
    outputs: { precioOptimo: 55 },
    creadoEn: '2026-09-03T18:00:00.000Z',
  };

  it('acepta un escenario completo y válido', () => {
    const resultado = EscenarioSchema.safeParse(escenarioValido);
    expect(resultado.success).toBe(true);
  });

  it('no exige campos internos como usuarioId en la respuesta pública', () => {
    const resultado = EscenarioSchema.safeParse(escenarioValido);
    expect(resultado.success).toBe(true);
  });

  it('rechaza id que no es UUID', () => {
    const resultado = EscenarioSchema.safeParse({ ...escenarioValido, id: 'no-es-uuid' });
    expect(resultado.success).toBe(false);
  });

  it('rechaza creadoEn que no es fecha ISO válida', () => {
    const resultado = EscenarioSchema.safeParse({ ...escenarioValido, creadoEn: 'ayer' });
    expect(resultado.success).toBe(false);
  });
});

describe('ParametrosListadoEscenariosSchema', () => {
  it('acepta { page: 1, tamano: 20 } sin tipo (retrocompatibilidad)', () => {
    const res = ParametrosListadoEscenariosSchema.safeParse({ page: 1, tamano: 20 });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.tipo).toBeUndefined();
  });

  it("acepta { page: 1, tamano: 20, tipo: 'cuadratica' }", () => {
    const res = ParametrosListadoEscenariosSchema.safeParse({ page: 1, tamano: 20, tipo: 'cuadratica' });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.tipo).toBe('cuadratica');
  });

  it("acepta { tipo: 'pricing' } con defaults de page/tamano", () => {
    const res = ParametrosListadoEscenariosSchema.safeParse({ tipo: 'pricing' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.tipo).toBe('pricing');
      expect(res.data.page).toBe(1); // default ParametrosPaginacionSchema
      expect(res.data.tamano).toBe(20);
    }
  });

  it("rechaza { tipo: 'actuarial' }", () => {
    const res = ParametrosListadoEscenariosSchema.safeParse({ tipo: 'actuarial' });
    expect(res.success).toBe(false);
  });

  it("rechaza { tipo: '' }", () => {
    const res = ParametrosListadoEscenariosSchema.safeParse({ tipo: '' });
    expect(res.success).toBe(false);
  });
});

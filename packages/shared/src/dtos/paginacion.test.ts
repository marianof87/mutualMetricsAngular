import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ParametrosPaginacionSchema, paginadoSchema } from './paginacion';

describe('ParametrosPaginacionSchema', () => {
  it('aplica defaults cuando faltan', () => {
    const r = ParametrosPaginacionSchema.parse({});
    expect(r).toEqual({ page: 1, tamano: 20 });
  });

  it('coerciona strings a números', () => {
    const r = ParametrosPaginacionSchema.parse({ page: '3', tamano: '50' });
    expect(r).toEqual({ page: 3, tamano: 50 });
  });

  it('rechaza page no positivo', () => {
    expect(ParametrosPaginacionSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('rechaza tamano mayor al máximo', () => {
    expect(ParametrosPaginacionSchema.safeParse({ tamano: 200 }).success).toBe(false);
  });
});

describe('paginadoSchema', () => {
  const schema = paginadoSchema(z.object({ titulo: z.string() }));

  it('valida un paginado bien formado', () => {
    const r = schema.safeParse({
      datos: [{ titulo: 'a' }, { titulo: 'b' }],
      total: 2,
      pagina: 1,
      tamano: 20,
    });
    expect(r.success).toBe(true);
  });

  it('rechaza si los items no calzan el schema', () => {
    const r = schema.safeParse({
      datos: [{ titulo: 123 }],
      total: 1,
      pagina: 1,
      tamano: 20,
    });
    expect(r.success).toBe(false);
  });
});

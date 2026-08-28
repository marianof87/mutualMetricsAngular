import { describe, it, expect } from 'vitest';
import { LeadRequestSchema, LeadResponseSchema } from './lead';

describe('LeadRequestSchema', () => {
  it('acepta un input válido', () => {
    const ok = LeadRequestSchema.safeParse({
      nombre: 'Ana Pérez',
      empresa: 'Textil Sur',
      whatsapp: '+54 9 351 555-1234',
      email: 'ana.perez@empresa.com',
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza email con formato inválido', () => {
    const r = LeadRequestSchema.safeParse({
      nombre: 'Ana Pérez',
      empresa: 'Textil Sur',
      whatsapp: '+5493515551234',
      email: 'no-es-email',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza whatsapp con letras', () => {
    const r = LeadRequestSchema.safeParse({
      nombre: 'Ana Pérez',
      empresa: 'Textil Sur',
      whatsapp: 'abc123',
      email: 'ana.perez@empresa.com',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    const r = LeadRequestSchema.safeParse({
      nombre: '   ',
      empresa: 'Textil Sur',
      whatsapp: '+5493515551234',
      email: 'ana.perez@empresa.com',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza empresa vacía', () => {
    const r = LeadRequestSchema.safeParse({
      nombre: 'Ana Pérez',
      empresa: '',
      whatsapp: '+5493515551234',
      email: 'ana.perez@empresa.com',
    });
    expect(r.success).toBe(false);
  });
});

describe('LeadResponseSchema', () => {
  it('acepta una respuesta válida', () => {
    const ok = LeadResponseSchema.safeParse({
      id: '9b2b3b6e-7a1b-4f3e-9a0e-000000000001',
      recibidoEn: new Date().toISOString(),
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza id que no sea uuid', () => {
    const r = LeadResponseSchema.safeParse({
      id: 'no-uuid',
      recibidoEn: new Date().toISOString(),
    });
    expect(r.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { ContactoRequestSchema, ContactoResponseSchema } from './contacto';

describe('ContactoRequestSchema', () => {
  it('acepta un input válido', () => {
    const ok = ContactoRequestSchema.safeParse({
      nombre: 'Ana',
      email: 'ana@example.com',
      mensaje: 'Hola, quisiera saber más sobre el servicio.',
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza email con formato inválido', () => {
    const r = ContactoRequestSchema.safeParse({
      nombre: 'Ana',
      email: 'no-email',
      mensaje: 'un mensaje suficientemente largo',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza mensaje menor a 10 caracteres', () => {
    const r = ContactoRequestSchema.safeParse({
      nombre: 'Ana',
      email: 'ana@example.com',
      mensaje: 'corto',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    const r = ContactoRequestSchema.safeParse({
      nombre: '',
      email: 'ana@example.com',
      mensaje: 'un mensaje suficientemente largo',
    });
    expect(r.success).toBe(false);
  });
});

describe('ContactoResponseSchema', () => {
  it('acepta una respuesta válida', () => {
    const ok = ContactoResponseSchema.safeParse({
      id: '9b2b3b6e-7a1b-4f3e-9a0e-000000000001',
      recibidoEn: new Date().toISOString(),
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza id que no sea uuid', () => {
    const r = ContactoResponseSchema.safeParse({
      id: 'no-uuid',
      recibidoEn: new Date().toISOString(),
    });
    expect(r.success).toBe(false);
  });
});

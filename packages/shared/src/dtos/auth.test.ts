import { describe, it, expect } from 'vitest';
import {
  RegistrarRequestSchema,
  LoginRequestSchema,
  UsuarioSchema,
  SesionResponseSchema,
} from './auth';

describe('RegistrarRequestSchema', () => {
  it('acepta un input válido', () => {
    const ok = RegistrarRequestSchema.safeParse({
      email: 'ana@example.com',
      password: 'unaClaveSegura',
      nombre: 'Ana',
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza email con formato inválido', () => {
    const r = RegistrarRequestSchema.safeParse({
      email: 'no-email',
      password: 'unaClaveSegura',
      nombre: 'Ana',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza password menor a 8 caracteres', () => {
    const r = RegistrarRequestSchema.safeParse({
      email: 'ana@example.com',
      password: 'corta',
      nombre: 'Ana',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    const r = RegistrarRequestSchema.safeParse({
      email: 'ana@example.com',
      password: 'unaClaveSegura',
      nombre: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('LoginRequestSchema', () => {
  it('acepta un input válido', () => {
    const ok = LoginRequestSchema.safeParse({
      email: 'ana@example.com',
      password: 'unaClaveSegura',
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza email con formato inválido', () => {
    const r = LoginRequestSchema.safeParse({
      email: 'no-email',
      password: 'unaClaveSegura',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza password vacío', () => {
    const r = LoginRequestSchema.safeParse({
      email: 'ana@example.com',
      password: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('UsuarioSchema', () => {
  it('acepta un usuario válido', () => {
    const ok = UsuarioSchema.safeParse({
      id: '9b2b3b6e-7a1b-4f3e-9a0e-000000000001',
      email: 'ana@example.com',
      nombre: 'Ana',
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza id que no sea uuid', () => {
    const r = UsuarioSchema.safeParse({
      id: 'no-uuid',
      email: 'ana@example.com',
      nombre: 'Ana',
    });
    expect(r.success).toBe(false);
  });
});

describe('SesionResponseSchema', () => {
  it('acepta una sesión sin refreshToken', () => {
    const ok = SesionResponseSchema.safeParse({
      accessToken: 'jwt.token.aqui',
      usuario: {
        id: '9b2b3b6e-7a1b-4f3e-9a0e-000000000001',
        email: 'ana@example.com',
        nombre: 'Ana',
      },
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza una sesión sin usuario', () => {
    const r = SesionResponseSchema.safeParse({
      accessToken: 'jwt.token.aqui',
    });
    expect(r.success).toBe(false);
  });
});

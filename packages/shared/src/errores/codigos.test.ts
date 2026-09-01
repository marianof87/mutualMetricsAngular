import { describe, it, expect } from 'vitest';
import { CodigoError } from './codigos';
import * as CodigosModule from './codigos';

describe('CodigoError', () => {
  it('expone los codigos generales esperados', () => {
    expect(CodigoError.ENTRADA_INVALIDA).toBe('ENTRADA_INVALIDA');
    expect(CodigoError.ERROR_INTERNO).toBe('ERROR_INTERNO');
    expect(CodigoError.RECURSO_NO_ENCONTRADO).toBe('RECURSO_NO_ENCONTRADO');
    expect(CodigoError.SERVICIO_NO_DISPONIBLE).toBe('SERVICIO_NO_DISPONIBLE');
  });

  it('expone los codigos especificos de Contacto', () => {
    expect(CodigoError.CONTACTO_EMAIL_INVALIDO).toBe('CONTACTO_EMAIL_INVALIDO');
    expect(CodigoError.CONTACTO_MENSAJE_VACIO).toBe('CONTACTO_MENSAJE_VACIO');
  });
});

describe('CODIGOS_TOKEN_RECHAZADO (constante compartida — RED)', () => {
  it('existe, es un array no vacio y contiene exactamente AUTH_TOKEN_EXPIRADO y AUTH_TOKEN_INVALIDO', () => {
    const CODIGOS_TOKEN_RECHAZADO = (CodigosModule as unknown as { CODIGOS_TOKEN_RECHAZADO?: unknown }).CODIGOS_TOKEN_RECHAZADO;
    expect(CODIGOS_TOKEN_RECHAZADO).toBeDefined();
    expect(Array.isArray(CODIGOS_TOKEN_RECHAZADO)).toBe(true);
    expect((CODIGOS_TOKEN_RECHAZADO as unknown[]).length).toBeGreaterThan(0);
    expect(CODIGOS_TOKEN_RECHAZADO).toEqual([
      CodigoError.AUTH_TOKEN_EXPIRADO,
      CodigoError.AUTH_TOKEN_INVALIDO,
    ]);
  });

  it('contiene solo strings y no incluye otros codigos como AUTH_CREDENCIALES_INVALIDAS', () => {
    const CODIGOS_TOKEN_RECHAZADO = (CodigosModule as unknown as { CODIGOS_TOKEN_RECHAZADO?: string[] }).CODIGOS_TOKEN_RECHAZADO;
    // Si no existe, el test anterior ya falla; este refuerza el contrato
    expect(CODIGOS_TOKEN_RECHAZADO).toBeDefined();
    if (!CODIGOS_TOKEN_RECHAZADO) return;
    expect(CODIGOS_TOKEN_RECHAZADO).not.toContain(CodigoError.AUTH_CREDENCIALES_INVALIDAS);
    expect(CODIGOS_TOKEN_RECHAZADO).not.toContain(CodigoError.ERROR_INTERNO);
    for (const code of CODIGOS_TOKEN_RECHAZADO) {
      expect(typeof code).toBe('string');
    }
  });

  it('es inmutable en contenido (longitud 2 y orden estable)', () => {
    const CODIGOS_TOKEN_RECHAZADO = (CodigosModule as unknown as { CODIGOS_TOKEN_RECHAZADO?: string[] }).CODIGOS_TOKEN_RECHAZADO;
    expect(CODIGOS_TOKEN_RECHAZADO).toBeDefined();
    if (!CODIGOS_TOKEN_RECHAZADO) return;
    expect(CODIGOS_TOKEN_RECHAZADO).toHaveLength(2);
    // Orden debe ser EX PIRADO primero, luego INVALIDO (contrato del refactor)
    expect(CODIGOS_TOKEN_RECHAZADO[0]).toBe('AUTH_TOKEN_EXPIRADO');
    expect(CODIGOS_TOKEN_RECHAZADO[1]).toBe('AUTH_TOKEN_INVALIDO');
  });
});

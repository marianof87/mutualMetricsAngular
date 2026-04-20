import { describe, it, expect } from 'vitest';
import { crearEnvelopeError, EnvelopeErrorSchema } from './envelope';
import { CodigoError } from './codigos';

describe('envelope de error', () => {
  it('genera un envelope válido con code y message', () => {
    const e = crearEnvelopeError(CodigoError.ENTRADA_INVALIDA, 'Falta el campo email');
    expect(EnvelopeErrorSchema.safeParse(e).success).toBe(true);
    expect(e.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('omite details y traceId si no se proveen', () => {
    const e = crearEnvelopeError(CodigoError.ERROR_INTERNO, 'Algo salió mal');
    expect(e.error.details).toBeUndefined();
    expect(e.error.traceId).toBeUndefined();
  });

  it('incluye details y traceId cuando se pasan', () => {
    const e = crearEnvelopeError(CodigoError.ENTRADA_INVALIDA, 'msg', { campo: 'email' }, 'abc-123');
    expect(e.error.details).toEqual({ campo: 'email' });
    expect(e.error.traceId).toBe('abc-123');
  });
});

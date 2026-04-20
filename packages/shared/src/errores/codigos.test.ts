import { describe, it, expect } from 'vitest';
import { CodigoError } from './codigos';

describe('CodigoError', () => {
  it('expone los códigos generales esperados', () => {
    expect(CodigoError.ENTRADA_INVALIDA).toBe('ENTRADA_INVALIDA');
    expect(CodigoError.ERROR_INTERNO).toBe('ERROR_INTERNO');
    expect(CodigoError.RECURSO_NO_ENCONTRADO).toBe('RECURSO_NO_ENCONTRADO');
    expect(CodigoError.SERVICIO_NO_DISPONIBLE).toBe('SERVICIO_NO_DISPONIBLE');
  });

  it('expone los códigos específicos de Contacto', () => {
    expect(CodigoError.CONTACTO_EMAIL_INVALIDO).toBe('CONTACTO_EMAIL_INVALIDO');
    expect(CodigoError.CONTACTO_MENSAJE_VACIO).toBe('CONTACTO_MENSAJE_VACIO');
  });
});

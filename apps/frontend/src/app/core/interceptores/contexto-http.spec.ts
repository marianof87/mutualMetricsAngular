import { describe, it, expect } from 'vitest';
import { HttpContext } from '@angular/common/http';
import { OMITIR_REDIRECCION_SESION } from './contexto-http';

describe('OMITIR_REDIRECCION_SESION', () => {
  it('es un HttpContextToken<boolean> cuyo default es false', () => {
    const ctx = new HttpContext();
    expect(ctx.get(OMITIR_REDIRECCION_SESION)).toBe(false);
  });

  it('permite setear a true y luego leer true', () => {
    const ctx = new HttpContext().set(OMITIR_REDIRECCION_SESION, true);
    expect(ctx.get(OMITIR_REDIRECCION_SESION)).toBe(true);
  });

  it('vuelve a false en un nuevo contexto (no hay leak entre requests)', () => {
    const ctx1 = new HttpContext().set(OMITIR_REDIRECCION_SESION, true);
    expect(ctx1.get(OMITIR_REDIRECCION_SESION)).toBe(true);

    const ctx2 = new HttpContext();
    expect(ctx2.get(OMITIR_REDIRECCION_SESION)).toBe(false);
  });

  it('permite volver a setear a false explicitamente', () => {
    const ctx = new HttpContext().set(OMITIR_REDIRECCION_SESION, true).set(OMITIR_REDIRECCION_SESION, false);
    expect(ctx.get(OMITIR_REDIRECCION_SESION)).toBe(false);
  });
});

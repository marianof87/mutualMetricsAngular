import { describe, it, expect } from 'vitest';
import { inputsReEjecutables, RUTAS_RE_EJECUTAR, rutaReEjecutar } from './reejecutar.helper';

describe('reejecutar.helper', () => {
  it('rutaReEjecutar devuelve la calculadora correcta para cada tipo', () => {
    expect(rutaReEjecutar('cuadratica')).toBe('/cuadratica');
    expect(rutaReEjecutar('pricing')).toBe('/pricing');
  });

  it('rutaReEjecutar devuelve null para un tipo desconocido', () => {
    expect(rutaReEjecutar('exotico')).toBeNull();
  });

  it('RUTAS_RE_EJECUTAR cubre solo los tipos con calculadora', () => {
    expect(Object.keys(RUTAS_RE_EJECUTAR)).toEqual(['cuadratica', 'pricing']);
  });

  it('inputs con claves se consideran re-ejecutables', () => {
    expect(inputsReEjecutables({ a: 1, b: { c: 2 } })).toBe(true);
  });

  it('inputs vacíos, nulos o no-objeto no son re-ejecutables', () => {
    expect(inputsReEjecutables({})).toBe(false);
    expect(inputsReEjecutables(null)).toBe(false);
    expect(inputsReEjecutables(undefined)).toBe(false);
  });

  it('un array no cuenta como objeto de inputs', () => {
    expect(inputsReEjecutables([] as unknown as Record<string, unknown>)).toBe(false);
  });
});

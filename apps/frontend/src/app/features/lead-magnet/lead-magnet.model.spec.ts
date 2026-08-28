import { describe, expect, it } from 'vitest';
import { LeadMagnetModelo } from './lead-magnet.model';

describe('LeadMagnetModelo', () => {
  it('calcula resultados con los valores por defecto', () => {
    const modelo = new LeadMagnetModelo();
    const r = modelo.resultados();
    expect(r).not.toBeNull();
    expect(r!.precioOptimo).toBe(30);
    expect(r!.gananciaMaxima).toBe(800);
  });

  it('devuelve null cuando el coeficiente A no es negativo', () => {
    const modelo = new LeadMagnetModelo();
    modelo.coeficienteA.set(2);
    expect(modelo.resultados()).toBeNull();
  });

  it('devuelve null cuando el mínimo supera al máximo', () => {
    const modelo = new LeadMagnetModelo();
    modelo.precioMinimo.set(200);
    modelo.precioMaximo.set(100);
    expect(modelo.resultados()).toBeNull();
  });

  it('recorta el precio al mínimo cuando el óptimo queda fuera del rango', () => {
    const modelo = new LeadMagnetModelo();
    modelo.coeficienteA.set(-0.5);
    modelo.coeficienteB.set(5);
    expect(modelo.resultados()!.precioOptimo).toBe(10);
  });

  it('genera la curva entre el mínimo y el máximo', () => {
    const modelo = new LeadMagnetModelo();
    const curva = modelo.curva();
    expect(curva.datos.length).toBe(25);
    expect(curva.optimo).toEqual({ x: 30, y: 800 });
    expect(curva.labels[0]).toBe(10);
    expect(curva.labels[curva.labels.length - 1]).toBe(100);
  });
});
import { describe, it, expect } from 'vitest';
import { optimizarPrecio } from './optimizador';

describe('optimizarPrecio', () => {
  it('calcula el vértice cuando el óptimo cae dentro del rango', () => {
    const resultado = optimizarPrecio({
      coeficienteA: -2,
      coeficienteB: 120,
      coeficienteC: -1000,
      precioMinimo: 10,
      precioMaximo: 100,
    });

    // Vértice: x = -120 / (2 * -2) = 30; f(30) = -2*900 + 120*30 - 1000 = 800
    expect(resultado.precioOptimo).toBe(30);
    expect(resultado.gananciaMaxima).toBe(800);
    expect(resultado.estrategiaSugerida).toBe('Mantener el precio en el punto de equilibrio óptimo.');
  });

  it('recorta el precio al mínimo cuando el óptimo cae por debajo del rango', () => {
    const resultado = optimizarPrecio({
      coeficienteA: -0.5,
      coeficienteB: 5,
      coeficienteC: 0,
      precioMinimo: 20,
      precioMaximo: 100,
    });

    // Vértice: x = -5 / (2 * -0.5) = 5, por debajo del mínimo permitido (20)
    expect(resultado.precioOptimo).toBe(20);
    expect(resultado.estrategiaSugerida).toBe(
      'Demanda débil. Se sugiere mantener el precio en el mínimo para asegurar volumen.',
    );
  });

  it('recorta el precio al máximo cuando el óptimo cae por encima del rango', () => {
    const resultado = optimizarPrecio({
      coeficienteA: -1,
      coeficienteB: 300,
      coeficienteC: -1000,
      precioMinimo: 10,
      precioMaximo: 50,
    });

    // Vértice: x = -300 / (2 * -1) = 150, por encima del máximo permitido (50)
    expect(resultado.precioOptimo).toBe(50);
    expect(resultado.estrategiaSugerida).toBe(
      'El mercado tolera un precio mayor. Considerar expandir el límite máximo.',
    );
  });

  it('redondea a dos decimales', () => {
    const resultado = optimizarPrecio({
      coeficienteA: -3,
      coeficienteB: 10,
      coeficienteC: -1000,
      precioMinimo: 10,
      precioMaximo: 100,
    });

    // Vértice: x = -10 / (2 * -3) = 1.6666..., recortado a 10; f(10) = -3*100 + 100 - 1000 = -1200
    expect(resultado.precioOptimo).toBe(10);
    expect(resultado.gananciaMaxima).toBe(-1200);
  });

  it('lanza un error cuando el coeficiente A es cero o positivo', () => {
    expect(() =>
      optimizarPrecio({
        coeficienteA: 0,
        coeficienteB: 120,
        coeficienteC: -1000,
        precioMinimo: 10,
        precioMaximo: 100,
      }),
    ).toThrow(RangeError);

    expect(() =>
      optimizarPrecio({
        coeficienteA: 2,
        coeficienteB: 120,
        coeficienteC: -1000,
        precioMinimo: 10,
        precioMaximo: 100,
      }),
    ).toThrow(/coeficiente A debe ser negativo/);
  });
});

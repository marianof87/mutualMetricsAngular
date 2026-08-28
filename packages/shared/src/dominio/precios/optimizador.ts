/**
 * Lógica de optimización de precios mediante modelo cuadrático.
 * Función pura y testeable, reutilizada entre frontend y backend.
 * Fórmula: el beneficio es f(x) = ax² + bx + c, con a < 0 (parábola con máximo).
 */

import type { OptimizarPrecioRequest, OptimizarPrecioResponse } from '../../dtos/precio';

/**
 * Calcula el precio óptimo y la ganancia máxima para una parábola de beneficio.
 * @param datos Coeficientes A, B, C y límites de precio
 * @returns Precio óptimo, ganancia máxima y estrategia sugerida
 */
export function optimizarPrecio(datos: OptimizarPrecioRequest): OptimizarPrecioResponse {
  const { coeficienteA, coeficienteB, coeficienteC, precioMinimo, precioMaximo } = datos;

  // Si a >= 0, la parábola abre hacia arriba y no existe un máximo de ganancia.
  if (coeficienteA >= 0) {
    throw new RangeError(
      'El coeficiente A debe ser negativo para representar una parábola con punto máximo de ganancia.',
    );
  }

  // Vértice de la parábola: x = -b / (2 * a)
  const precioOptimoCrudo = -coeficienteB / (2 * coeficienteA);

  // Forzar el precio dentro de los límites fijos por el usuario.
  const precioOptimo = recortar(precioOptimoCrudo, precioMinimo, precioMaximo);

  const gananciaMaxima =
    coeficienteA * Math.pow(precioOptimo, 2) + coeficienteB * precioOptimo + coeficienteC;

  const precioFinal = aDosDecimales(precioOptimo);
  const gananciaFinal = aDosDecimales(gananciaMaxima);

  const estrategiaSugerida = sugerirEstrategia(precioOptimoCrudo, precioMinimo, precioMaximo);

  return {
    precioOptimo: precioFinal,
    gananciaMaxima: gananciaFinal,
    estrategiaSugerida,
  };
}

function recortar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

function aDosDecimales(valor: number): number {
  return Number(valor.toFixed(2));
}

function sugerirEstrategia(precioOptimo: number, precioMinimo: number, precioMaximo: number): string {
  if (precioOptimo >= precioMaximo) {
    return 'El mercado tolera un precio mayor. Considerar expandir el límite máximo.';
  }
  if (precioOptimo <= precioMinimo) {
    return 'Demanda débil. Se sugiere mantener el precio en el mínimo para asegurar volumen.';
  }
  return 'Mantener el precio en el punto de equilibrio óptimo.';
}
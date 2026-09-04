import { CodigoError } from '../../errores/codigos';

/**
 * Tipo de solución de una ecuación cuadrática según su discriminante.
 */
export type TipoSolucion = 'dosReales' | 'unaRealDoble' | 'sinRaicesReales';

/**
 * Resultado de resolver ax² + bx + c = 0.
 * La relación entre tipo y raices: dosReales/unaRealDoble → raices con 2 valores;
 * sinRaicesReales → raices null.
 */
export type ResultadoCuadratica = {
  discriminante: number;
  tipo: TipoSolucion;
  raices: [number, number] | null;
  vertice: { x: number; y: number };
};

/**
 * Resuelve la ecuación cuadrática ax² + bx + c = 0.
 * @param a Coeficiente cuadrático. NO puede ser 0 (lanza CUADRATICA_A_CERO).
 * @param b Coeficiente lineal
 * @param c Término independiente
 * @returns discriminante, tipo de solución, raíces (null si son no reales) y vértice
 */
export function resolverCuadratica(a: number, b: number, c: number): ResultadoCuadratica {
  if (a === 0) {
    throw new Error(CodigoError.CUADRATICA_A_CERO);
  }

  const discriminante = b * b - 4 * a * c;
  const xVertice = -b / (2 * a);
  const yVertice = a * xVertice * xVertice + b * xVertice + c;
  const vertice = { x: xVertice, y: yVertice };

  if (discriminante > 0) {
    const raizDiscriminante = Math.sqrt(discriminante);
    return {
      discriminante,
      tipo: 'dosReales',
      raices: [(-b - raizDiscriminante) / (2 * a), (-b + raizDiscriminante) / (2 * a)],
      vertice,
    };
  }

  if (discriminante === 0) {
    const raizDoble = -b / (2 * a);
    return { discriminante, tipo: 'unaRealDoble', raices: [raizDoble, raizDoble], vertice };
  }

  return { discriminante, tipo: 'sinRaicesReales', raices: null, vertice };
}
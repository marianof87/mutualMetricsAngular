/**
 * Estadística descriptiva para los resultados de la simulación Monte Carlo.
 * Funciones puras y deterministas: dado el mismo arreglo, el mismo resultado.
 */

export function calcularMedia(valores: number[]): number {
  if (valores.length === 0) return NaN;
  return valores.reduce((acumulado, valor) => acumulado + valor, 0) / valores.length;
}

export function calcularDesvio(valores: number[]): number {
  if (valores.length < 2) return 0;
  const media = calcularMedia(valores);
  const sumaDeCuadrados = valores.reduce(
    (acumulado, valor) => acumulado + (valor - media) ** 2,
    0,
  );
  return Math.sqrt(sumaDeCuadrados / (valores.length - 1));
}

/**
 * Percentil por el método R-7 (el mismo de numpy y PERCENTILE.INC de Excel).
 * @param valores no necesita estar ordenado: se ordena internamente.
 * @param percentil valor entre 0 y 1 (0.95 = percentil 95).
 */
export function calcularPercentil(valores: number[], percentil: number): number {
  if (valores.length === 0) return NaN;
  const datos = [...valores].sort((a, b) => a - b);
  const posicion = (datos.length - 1) * percentil + 1;
  const indice = Math.floor(posicion) - 1;
  const fraccion = posicion - Math.floor(posicion);
  if (indice >= datos.length - 1) return datos[datos.length - 1];
  return (1 - fraccion) * datos[indice] + fraccion * datos[indice + 1];
}

export function aDosDecimales(valor: number): number {
  return Number(valor.toFixed(2));
}
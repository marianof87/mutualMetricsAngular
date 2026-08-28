import type { ParametroEstocastico } from '../../dtos/actuarial';

// Generador de números pseudoaleatorios determinista (mulberry32): la misma
// semilla produce la misma secuencia, lo que hace los tests reproducibles.

export type GeneradorAleatorio = () => number;

export function crearAleatorio(semilla: number): GeneradorAleatorio {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function muestrearUniforme(
  aleatorio: GeneradorAleatorio,
  minimo: number,
  maximo: number,
): number {
  return minimo + (maximo - minimo) * aleatorio();
}

export function muestrearTriangular(
  aleatorio: GeneradorAleatorio,
  minimo: number,
  moda: number,
  maximo: number,
): number {
  if (maximo === minimo) return minimo;
  const u = aleatorio();
  const fraccionModa = (moda - minimo) / (maximo - minimo);
  if (u < fraccionModa) {
    return minimo + Math.sqrt(u * (maximo - minimo) * (moda - minimo));
  }
  return maximo - Math.sqrt((1 - u) * (maximo - minimo) * (maximo - moda));
}

/**
 * Muestreo de una normal truncada al rango [minimo, maximo]: la media cae en el
 * centro y el desvío se deriva del nivel de confianza ("entre X e Y con un Z%
 * de probabilidad"). El truncamiento evita costos negativos o absurdos.
 */
export function muestrearNormalTruncada(
  aleatorio: GeneradorAleatorio,
  minimo: number,
  maximo: number,
  nivelConfianza: number,
): number {
  const media = (minimo + maximo) / 2;
  const desvio = (maximo - minimo) / (2 * cuantilNormal((1 + nivelConfianza) / 2));
  for (let intento = 0; intento < 100; intento++) {
    const valor = media + desvio * muestrearZNormal(aleatorio);
    if (valor >= minimo && valor <= maximo) return valor;
  }
  // Red de seguridad: tras 100 rechazos (rango patológico), clavar en la media.
  return media;
}

export function muestrearParametro(
  aleatorio: GeneradorAleatorio,
  parametro: ParametroEstocastico,
): number {
  switch (parametro.tipo) {
    case 'fijo':
      return parametro.valor;
    case 'triangular':
      return muestrearTriangular(aleatorio, parametro.minimo, parametro.moda, parametro.maximo);
    case 'normal':
      return muestrearNormalTruncada(
        aleatorio,
        parametro.minimo,
        parametro.maximo,
        parametro.nivelConfianza,
      );
  }
}

function muestrearZNormal(aleatorio: GeneradorAleatorio): number {
  const u1 = Math.max(aleatorio(), 1e-12);
  const u2 = aleatorio();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Cuantil de la normal estándar (inversa de la CDF) por la aproximación racional
 * de Acklam — precisión ~1.1e-9, suficiente para derivar desvíos de rangos.
 */
export function cuantilNormal(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number;
  let r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
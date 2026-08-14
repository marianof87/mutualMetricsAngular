import type {
  DistribucionResumen,
  SimulacionActuarialRequest,
  SimulacionActuarialResponse,
} from '../../dtos/actuarial';
import { crearAleatorio, muestrearParametro } from './distribuciones';
import { aDosDecimales, calcularDesvio, calcularMedia, calcularPercentil } from './estadistica';

const CANTIDAD_PUNTOS_CURVA = 50;
const PERCENTILES_INFORMADOS = [5, 25, 50, 75, 95];

interface Muestra {
  a: number;
  c: number;
  precioOptimo: number;
  ganancia: number;
  piso: number | null; // null = ningún precio cubre los costos
}

/**
 * Motor actuarial: simulación Monte Carlo sobre la parábola de ganancia
 * G(P) = A·P² + B·P + C con A y C estocásticos. Devuelve intervalos con
 * probabilidad en lugar de un número falso con dos decimales (OBJ-2).
 */
export function simularRiesgo(solicitud: SimulacionActuarialRequest): SimulacionActuarialResponse {
  const {
    coeficienteA,
    coeficienteB,
    coeficienteC,
    precioMinimo,
    precioMaximo,
    precioActual,
    nSimulaciones = 10_000,
    nivelConfianza = 0.95,
    semilla,
  } = solicitud;

  const semillaEfectiva = semilla ?? Math.floor(Math.random() * 2_147_483_647);
  const aleatorio = crearAleatorio(semillaEfectiva);

  const muestras: Muestra[] = [];
  let muestrasInvalidas = 0;
  let pierdenEnOptimo = 0;
  let pierdenEnPrecioActual = 0;

  for (let indice = 0; indice < nSimulaciones; indice++) {
    const a = muestrearParametro(aleatorio, coeficienteA);
    // A >= 0 implica demanda creciente con el precio: parábola degenerada.
    if (a >= 0) {
      muestrasInvalidas++;
      continue;
    }
    const c = muestrearParametro(aleatorio, coeficienteC);

    const precioOptimo = recortar(-coeficienteB / (2 * a), precioMinimo, precioMaximo);
    const ganancia = a * precioOptimo ** 2 + coeficienteB * precioOptimo + c;
    const piso = calcularPiso(a, coeficienteB, c);

    muestras.push({ a, c, precioOptimo, ganancia, piso });
    if (ganancia < 0) pierdenEnOptimo++;
    if (precioActual !== undefined) {
      const gananciaActual = a * precioActual ** 2 + coeficienteB * precioActual + c;
      if (gananciaActual < 0) pierdenEnPrecioActual++;
    }
  }

  const cantidadValidas = muestras.length;
  const resumenPrecio = resumen(
    muestras.map((muestra) => muestra.precioOptimo),
    nivelConfianza,
  );
  const resumenGanancia = resumen(
    muestras.map((muestra) => muestra.ganancia),
    nivelConfianza,
  );
  const pisosFinitos = muestras
    .map((muestra) => muestra.piso)
    .filter((piso): piso is number => piso !== null);
  const resumenEquilibrio = resumen(pisosFinitos, nivelConfianza);
  const fraccionConPiso = cantidadValidas === 0 ? 0 : pisosFinitos.length / cantidadValidas;

  const pisoSolvencia =
    fraccionConPiso >= nivelConfianza
      ? aDosDecimales(calcularPercentil(pisosFinitos, nivelConfianza))
      : null;

  const preciosCurva = generarCurvaDePrecios(precioMinimo, precioMaximo);
  const conteosDePerdida = new Array(CANTIDAD_PUNTOS_CURVA).fill(0);
  for (const muestra of muestras) {
    for (let j = 0; j < CANTIDAD_PUNTOS_CURVA; j++) {
      if (gananciaEn(muestra, preciosCurva[j], coeficienteB) < 0) conteosDePerdida[j]++;
    }
  }
  const curvaRiesgo = preciosCurva.map((precio, indice) => ({
    precio: aDosDecimales(precio),
    probabilidadPerdida: aDosDecimales(
      cantidadValidas === 0 ? 0 : conteosDePerdida[indice] / cantidadValidas,
    ),
  }));

  return {
    nSimulaciones,
    semilla: semillaEfectiva,
    muestrasInvalidas,
    nivelConfianza,
    precioOptimo: resumenPrecio,
    gananciaMaxima: resumenGanancia,
    puntoEquilibrio: resumenEquilibrio,
    pisoSolvencia,
    probabilidadPerdida: {
      enPrecioOptimo: aDosDecimales(cantidadValidas === 0 ? 0 : pierdenEnOptimo / cantidadValidas),
      enPrecioActual:
        precioActual === undefined
          ? null
          : aDosDecimales(cantidadValidas === 0 ? 0 : pierdenEnPrecioActual / cantidadValidas),
    },
    curvaRiesgo,
    advertencias: construirAdvertencias({
      nSimulaciones,
      cantidadValidas,
      muestrasInvalidas,
      pierdenEnOptimo,
      nivelConfianza,
      fraccionConPiso,
      resumenPrecio,
      pisoSolvencia,
    }),
  };
}

/**
 * Piso de equilibrio de una muestra: el menor precio (≥ 0) a partir del cual la
 * ganancia deja de ser negativa. null si ningún precio cubre los costos.
 */
function calcularPiso(a: number, b: number, c: number): number | null {
  const discriminante = b ** 2 - 4 * a * c;
  if (discriminante < 0) return c < 0 ? null : 0;
  const raiz = Math.sqrt(discriminante);
  const raizMenor = (-b + raiz) / (2 * a);
  const raizMayor = (-b - raiz) / (2 * a);
  if (raizMenor >= 0) return raizMenor;
  return raizMayor > 0 ? 0 : null;
}

function gananciaEn(muestra: Muestra, precio: number, b: number): number {
  return muestra.a * precio ** 2 + b * precio + muestra.c;
}

function recortar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

function generarCurvaDePrecios(precioMinimo: number, precioMaximo: number): number[] {
  return Array.from(
    { length: CANTIDAD_PUNTOS_CURVA },
    (_, indice) =>
      precioMinimo +
      ((precioMaximo - precioMinimo) * indice) / (CANTIDAD_PUNTOS_CURVA - 1),
  );
}

function resumen(valores: number[], nivelConfianza: number): DistribucionResumen {
  const finitos = valores.filter((valor) => Number.isFinite(valor));
  if (finitos.length === 0) {
    return {
      media: 0,
      mediana: 0,
      desvio: 0,
      percentiles: {},
      intervalo: { minimo: 0, maximo: 0 },
    };
  }
  const percentiles: Record<string, number> = {};
  for (const percentil of PERCENTILES_INFORMADOS) {
    percentiles[String(percentil)] = aDosDecimales(calcularPercentil(finitos, percentil / 100));
  }
  const pBajo = (1 - nivelConfianza) / 2;
  const pAlto = (1 + nivelConfianza) / 2;
  return {
    media: aDosDecimales(calcularMedia(finitos)),
    mediana: aDosDecimales(calcularPercentil(finitos, 0.5)),
    desvio: aDosDecimales(calcularDesvio(finitos)),
    percentiles,
    intervalo: {
      minimo: aDosDecimales(calcularPercentil(finitos, pBajo)),
      maximo: aDosDecimales(calcularPercentil(finitos, pAlto)),
    },
  };
}

function construirAdvertencias(datos: {
  nSimulaciones: number;
  cantidadValidas: number;
  muestrasInvalidas: number;
  pierdenEnOptimo: number;
  nivelConfianza: number;
  fraccionConPiso: number;
  resumenPrecio: DistribucionResumen;
  pisoSolvencia: number | null;
}): string[] {
  const advertencias: string[] = [];
  if (datos.cantidadValidas === 0) {
    advertencias.push(
      'Ningún escenario fue aprovechable: todos los valores de sensibilidad salieron no negativos (A >= 0).',
    );
    return advertencias;
  }
  if (datos.muestrasInvalidas / datos.nSimulaciones > 0.05) {
    advertencias.push(
      `Se descartó el ${porcentaje(datos.muestrasInvalidas / datos.nSimulaciones)}% de los escenarios por sensibilidad no negativa (A >= 0): los datos no sostienen una parábola estable.`,
    );
  }
  const probabilidadEnOptimo = datos.pierdenEnOptimo / datos.cantidadValidas;
  if (probabilidadEnOptimo > 0.1) {
    advertencias.push(
      `Con el precio óptimo, el ${porcentaje(probabilidadEnOptimo)}% de los escenarios igualmente pierde: revisá la estructura de costos o subí el piso de precio.`,
    );
  }
  const { mediana, intervalo } = datos.resumenPrecio;
  if (mediana > 0 && (intervalo.maximo - intervalo.minimo) / mediana > 0.2) {
    advertencias.push(
      `El intervalo del precio óptimo es amplio (${intervalo.minimo}–${intervalo.maximo}): mejorá la estimación de la sensibilidad antes de fijar precios.`,
    );
  }
  if (datos.pisoSolvencia === null) {
    advertencias.push(
      `Con un nivel de confianza del ${porcentaje(datos.nivelConfianza)}%, no existe precio que cubra los costos: la estructura actual no es solvente en más del ${porcentaje(1 - datos.fraccionConPiso)}% de los escenarios.`,
    );
  }
  return advertencias;
}

function porcentaje(fraccion: number): number {
  return Math.round(fraccion * 100);
}
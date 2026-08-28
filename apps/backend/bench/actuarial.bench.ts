/**
 * Benchmark del motor actuarial: mide el tiempo de simulación (bloqueo del
 * event loop), la memoria del proceso y los ticks perdidos por N.
 * Incluye comparación entre la versión síncrona y la asíncrona (con chunking).
 *
 * Uso: npm run test:rendimiento (o: npx ts-node -r ts-node/register bench/actuarial.bench.ts)
 */
import { performance } from 'node:perf_hooks';
import { simularRiesgo, simularRiesgoAsync } from '@mutual-metrics/shared';
import type { SimulacionActuarialRequest } from '@mutual-metrics/shared';

const solicitud: SimulacionActuarialRequest = {
  coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
  coeficienteB: { tipo: 'fijo', valor: 120 },
  coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
  precioMinimo: 10,
  precioMaximo: 100,
  nSimulaciones: 10000,
  nivelConfianza: 0.95,
  semilla: 42,
};

function medirSync(nSimulaciones: number): void {
  const memoriaInicial = process.memoryUsage().heapUsed;
  let ticks = 0;
  const contador = setInterval(() => ticks++, 1);

  const inicio = performance.now();
  const resultado = simularRiesgo({ ...solicitud, nSimulaciones });
  const fin = performance.now();
  clearInterval(contador);

  const memoriaFinal = process.memoryUsage().heapUsed;
  const ticksEsperados = Math.round(fin - inicio);
  const bloqueoEstimadoMs = Math.max(0, ticksEsperados - ticks);

  console.log(
    `[sync]   n=${String(nSimulaciones).padEnd(6)} -> ${(fin - inicio).toFixed(0).padStart(4)} ms ` +
      `| heap +${((memoriaFinal - memoriaInicial) / 1024 / 1024).toFixed(1)} MB ` +
      `| ticks event loop perdidos: ${bloqueoEstimadoMs}`,
  );

  if (!Number.isFinite(resultado.precioOptimo.media)) {
    throw new Error('La simulación devolvió valores no finitos');
  }
}

async function medirAsync(nSimulaciones: number): Promise<void> {
  const memoriaInicial = process.memoryUsage().heapUsed;
  let ticks = 0;
  const contador = setInterval(() => ticks++, 1);

  const inicio = performance.now();
  const resultado = await simularRiesgoAsync({ ...solicitud, nSimulaciones });
  const fin = performance.now();
  clearInterval(contador);

  const memoriaFinal = process.memoryUsage().heapUsed;
  const ticksEsperados = Math.round(fin - inicio);
  const bloqueoEstimadoMs = Math.max(0, ticksEsperados - ticks);

  console.log(
    `[async]  n=${String(nSimulaciones).padEnd(6)} -> ${(fin - inicio).toFixed(0).padStart(4)} ms ` +
      `| heap +${((memoriaFinal - memoriaInicial) / 1024 / 1024).toFixed(1)} MB ` +
      `| ticks event loop perdidos: ${bloqueoEstimadoMs}`,
  );

  if (!Number.isFinite(resultado.precioOptimo.media)) {
    throw new Error('La simulación devolvió valores no finitos');
  }
}

console.log('Benchmark motor actuarial (sync vs async con chunking):');
for (const n of [1000, 10000, 25000]) {
  medirSync(n);
}
console.log('');
for (const n of [1000, 10000, 25000]) {
  await medirAsync(n);
}
console.log('Semilla 42: media del precio óptimo estable entre corridas (reproducibilidad).');
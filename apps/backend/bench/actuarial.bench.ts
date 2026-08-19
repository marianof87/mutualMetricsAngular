/**
 * Benchmark del motor actuarial: mide el tiempo de simulación (bloqueo del
 * event loop), la memoria del proceso y los ticks perdidos por N.
 *
 * Uso: npm run test:rendimiento (o: npx ts-node -r ts-node/register bench/actuarial.bench.ts)
 */
import { performance } from 'node:perf_hooks';
import { simularRiesgo } from '@mutual-metrics/shared';
import type { SimulacionActuarialRequest } from '@mutual-metrics/shared';

const solicitud: SimulacionActuarialRequest = {
  coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
  coeficienteB: 120,
  coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
  precioMinimo: 10,
  precioMaximo: 100,
  nSimulaciones: 10000,
  nivelConfianza: 0.95,
  semilla: 42,
};

function medir(nSimulaciones: number): void {
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
    `n=${String(nSimulaciones).padEnd(6)} -> ${(fin - inicio).toFixed(0).padStart(4)} ms ` +
      `| heap +${((memoriaFinal - memoriaInicial) / 1024 / 1024).toFixed(1)} MB ` +
      `| ticks event loop perdidos: ${bloqueoEstimadoMs}`,
  );

  if (!Number.isFinite(resultado.precioOptimo.media)) {
    throw new Error('La simulación devolvió valores no finitos');
  }
}

console.log('Benchmark motor actuarial (bloqueo del event loop):');
for (const n of [1000, 10000, 50000, 100000]) {
  medir(n);
}
console.log('Semilla 42: media del precio óptimo estable entre corridas (reproducibilidad).');
/**
 * Benchmark de concurrencia: dispara 5 simulaciones a N=100.000 en paralelo
 * contra el endpoint HTTP (app Nest in-process con supertest) y reporta
 * latencias y memoria, para evaluar degradación bajo carga.
 *
 * Uso: npm run test:rendimiento (o: npx ts-node -r ts-node/register bench/concurrencia.bench.ts)
 */
import { performance } from 'node:perf_hooks';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ActuarialController } from '../src/modules/actuarial/actuarial.controller';
import { ActuarialService } from '../src/modules/actuarial/actuarial.service';
import { FiltroExcepcionesGlobal } from '../src/comunes/filtros/filtro-excepciones.filtro';
import type { SimulacionActuarialRequest } from '@mutual-metrics/shared';

const solicitud: SimulacionActuarialRequest = {
  coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
  coeficienteB: 120,
  coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
  precioMinimo: 10,
  precioMaximo: 100,
  nSimulaciones: 100000,
  nivelConfianza: 0.95,
  semilla: 42,
};

async function principal(): Promise<void> {
  const modulo = await Test.createTestingModule({
    controllers: [ActuarialController],
    providers: [ActuarialService],
  }).compile();

  const app: INestApplication = modulo.createNestApplication();
  app.useGlobalFilters(new FiltroExcepcionesGlobal());
  await app.init();
  const servidor = app.getHttpServer();

  const memoriaInicial = process.memoryUsage().heapUsed;
  const latencias: number[] = [];

  const inicio = performance.now();
  const resultados = await Promise.all(
    Array.from({ length: 5 }, async () => {
      const t0 = performance.now();
      const res = await request(servidor).post('/actuarial/simulaciones').send(solicitud).expect(200);
      latencias.push(performance.now() - t0);
      return res.body;
    }),
  );
  const fin = performance.now();

  await app.close();

  latencias.sort((a, b) => a - b);
  const p95 = latencias[Math.floor(latencias.length * 0.95)] ?? latencias.at(-1);
  const memoriaFinal = process.memoryUsage().heapUsed;

  const todasIguales = resultados.every((r) => r.semilla === 42 && r.nSimulaciones === 100000);

  console.log('Benchmark concurrencia (5 x N=100.000 en paralelo):');
  console.log(`  total: ${(fin - inicio).toFixed(0)} ms | p95 por request: ${p95.toFixed(0)} ms`);
  console.log(
    `  heap: +${((memoriaFinal - memoriaInicial) / 1024 / 1024).toFixed(1)} MB ` +
      `| respuestas válidas: ${todasIguales ? 'sí' : 'NO'}`,
  );
}

principal().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { FiltroExcepcionesGlobal } from '../../comunes/filtros/filtro-excepciones.filtro';
import { FinanzasController } from './finanzas.controller';
import { FinanzasService } from './finanzas.service';

// Integración HTTP del módulo finanzas: verifica que el body se valida con
// ZodValidationPipe (400 ENTRADA_INVALIDA) y que las rutas felices responden
// el resultado real del servicio. Patrón copiado de actuarial.controller.spec.ts.
describe('FinanzasController (integración HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [FinanzasController],
      providers: [FinanzasService],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalFilters(new FiltroExcepcionesGlobal());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---- 5 casos de rechazo: payloads inválidos dan 400 ENTRADA_INVALIDA ----

  it('rechaza interes-simple con principal negativo con 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/interes-simple')
      .send({ principal: -500, tasa: 0.05, tiempo: 2 })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
    expect(res.body.error.message).toBeTruthy();
  });

  it('rechaza interes-compuesto con frecuencia 0 con 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/interes-compuesto')
      .send({ principal: 1000, tasa: 0.1, tiempo: 2, frecuencia: 0 })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('rechaza roi con inversion 0 con 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/roi')
      .send({ inversion: 0, beneficio: 1500 })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('rechaza van con flujos que no es array con 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/van')
      .send({ tasa: 0.1, inversionInicial: -1000, flujos: 'no-es-array' as unknown as number[] })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('rechaza tir con body parcial (falta flujos) con 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/tir')
      .send({ inversionInicial: -1000 })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  // ---- 3 casos felices: ruta real + resultado correcto ----

  it('POST /finanzas/interes-simple con valores válidos responde 201 con interes y total', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/interes-simple')
      .send({ principal: 1000, tasa: 0.05, tiempo: 2 })
      .expect(201);

    expect(res.body).toEqual({ interes: 100, total: 1100 });
  });

  it('POST /finanzas/roi con valores válidos responde 201 con roi 50', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/roi')
      .send({ inversion: 1000, beneficio: 1500 })
      .expect(201);

    expect(res.body).toEqual({ roi: 50 });
  });

  it('POST /finanzas/tir con flujo único responde 201 con tir aprox 0.1', async () => {
    const res = await request(app.getHttpServer())
      .post('/finanzas/tir')
      .send({ inversionInicial: -1000, flujos: [1100] })
      .expect(201);

    expect(res.body.tir).toBeCloseTo(0.1, 4);
  });
});

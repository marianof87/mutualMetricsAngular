import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { FiltroExcepcionesGlobal } from '../../comunes/filtros/filtro-excepciones.filtro';
import { ActuarialController } from './actuarial.controller';
import { ActuarialService } from './actuarial.service';
import type {
  SimulacionActuarialRequest,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';
import { SimulacionActuarialResponseSchema } from '@mutual-metrics/shared';

describe('ActuarialController (integración HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [ActuarialController],
      providers: [ActuarialService],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalFilters(new FiltroExcepcionesGlobal());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const solicitudValida: SimulacionActuarialRequest = {
    coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
    coeficienteB: 120,
    coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
    precioMinimo: 10,
    precioMaximo: 100,
    precioActual: 30,
    nSimulaciones: 1000,
    nivelConfianza: 0.95,
    semilla: 42,
  };

  it('POST /actuarial/simulaciones responde 200 con la estructura completa de la respuesta', async () => {
    const res = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send(solicitudValida)
      .expect(200);

    const validacion = SimulacionActuarialResponseSchema.safeParse(res.body);
    expect(validacion.success).toBe(true);
    expect(res.body.semilla).toBe(42);
    expect(res.body.nSimulaciones).toBe(1000);
    expect(res.body.curvaRiesgo.length).toBe(50);
  });

  it('responde el mismo resultado con la misma semilla (reproducibilidad HTTP)', async () => {
    const primera = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send(solicitudValida)
      .expect(200);
    const segunda = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send(solicitudValida)
      .expect(200);

    expect(segunda.body).toEqual(primera.body);
  });

  it('rechaza minimo > maximo con 400 ENTRADA_INVALIDA en el envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send({
        ...solicitudValida,
        coeficienteA: { tipo: 'triangular', minimo: -1, moda: -2, maximo: -3 },
      })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
    expect(res.body.error.message).toBeTruthy();
  });

  it('rechaza precios negativos con 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send({ ...solicitudValida, precioMinimo: -5 })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('rechaza nSimulaciones fuera de rango con 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send({ ...solicitudValida, nSimulaciones: 0 })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('rechaza una solicitud sin incertidumbre con 400 SIMULACION_SIN_INCERTIDUMBRE', async () => {
    const res = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send({
        coeficienteA: { tipo: 'fijo', valor: -2 },
        coeficienteB: 120,
        coeficienteC: { tipo: 'fijo', valor: -1000 },
        precioMinimo: 10,
        precioMaximo: 100,
        nSimulaciones: 500,
        nivelConfianza: 0.95,
      })
      .expect(400);

    expect(res.body.error.code).toBe('SIMULACION_SIN_INCERTIDUMBRE');
    expect(res.body.error.message).toContain('estocástico');
  });

  it('cubre el caso degenerado con advertencia sin fallar (todo A degenerado)', async () => {
    const res = await request(app.getHttpServer())
      .post('/actuarial/simulaciones')
      .send({
        coeficienteA: { tipo: 'normal', minimo: 0, maximo: 1, nivelConfianza: 0.9 },
        coeficienteB: 120,
        coeficienteC: { tipo: 'fijo', valor: -1000 },
        precioMinimo: 10,
        precioMaximo: 100,
        nSimulaciones: 500,
        nivelConfianza: 0.95,
      })
      .expect(200);

    expect(res.body.muestrasInvalidas).toBe(500);
    expect(res.body.advertencias[0]).toContain('Ningún escenario fue aprovechable');
  });
});

describe('ActuarialController (unitario)', () => {
  let controlador: ActuarialController;

  beforeEach(async () => {
    const respuestaMock: SimulacionActuarialResponse = {
      nSimulaciones: 10000,
      semilla: 42,
      muestrasInvalidas: 0,
      nivelConfianza: 0.95,
      precioOptimo: {
        media: 30,
        mediana: 30,
        desvio: 0.5,
        percentiles: { '5': 29, '50': 30, '95': 31 },
        intervalo: { minimo: 29.05, maximo: 30.95 },
      },
      gananciaMaxima: {
        media: 800,
        mediana: 800,
        desvio: 22,
        percentiles: { '5': 765, '50': 800, '95': 835 },
        intervalo: { minimo: 765, maximo: 835 },
      },
      puntoEquilibrio: {
        media: 10,
        mediana: 10,
        desvio: 0.2,
        percentiles: { '5': 9.7, '50': 10, '95': 10.3 },
        intervalo: { minimo: 9.7, maximo: 10.3 },
      },
      pisoSolvencia: 10.2,
      probabilidadPerdida: { enPrecioOptimo: 0, enPrecioActual: 0 },
      curvaRiesgo: [{ precio: 10, probabilidadPerdida: 0 }],
      advertencias: [],
    };

    const servicioMock = {
      simularRiesgo: jest.fn().mockReturnValue(respuestaMock),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [ActuarialController],
      providers: [{ provide: ActuarialService, useValue: servicioMock }],
    }).compile();

    controlador = modulo.get<ActuarialController>(ActuarialController);
  });

  it('delega en el servicio y devuelve el resultado de la simulación', () => {
    const solicitud: SimulacionActuarialRequest = {
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: 120,
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 10000,
      nivelConfianza: 0.95,
      semilla: 42,
    };

    const resultado = controlador.simular(solicitud);

    expect(resultado.nSimulaciones).toBe(10000);
    expect(resultado.precioOptimo.intervalo).toEqual({ minimo: 29.05, maximo: 30.95 });
    expect(resultado.pisoSolvencia).toBe(10.2);
  });
});
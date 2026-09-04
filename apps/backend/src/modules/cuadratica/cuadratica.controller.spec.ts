import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { FiltroExcepcionesGlobal } from '../../comunes/filtros/filtro-excepciones.filtro';
import { CuadraticaController } from './cuadratica.controller';
import { CuadraticaService } from './cuadratica.service';
import type { CuadraticaRequest, CuadraticaResponse } from '@mutual-metrics/shared';
import { CuadraticaResponseSchema } from '@mutual-metrics/shared';

describe('CuadraticaController (integración HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [CuadraticaController],
      providers: [CuadraticaService],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalFilters(new FiltroExcepcionesGlobal());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /cuadratica/resolver con {1,-3,2} responde 200 con D=1, dosReales, raices [1,2], vertice {1.5,-0.25}', async () => {
    const res = await request(app.getHttpServer())
      .post('/cuadratica/resolver')
      .send({ a: 1, b: -3, c: 2 })
      .expect(200);

    const validacion = CuadraticaResponseSchema.safeParse(res.body);
    expect(validacion.success).toBe(true);
    expect(res.body.discriminante).toBe(1);
    expect(res.body.tipo).toBe('dosReales');
    expect(res.body.raices).toEqual([1, 2]);
    expect(res.body.vertice).toEqual({ x: 1.5, y: -0.25 });
  });

  it('POST /cuadratica/resolver con {1,2,1} responde 200 con D=0, unaRealDoble, raices [-1,-1], vertice {-1,0}', async () => {
    const res = await request(app.getHttpServer())
      .post('/cuadratica/resolver')
      .send({ a: 1, b: 2, c: 1 })
      .expect(200);

    expect(CuadraticaResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.discriminante).toBe(0);
    expect(res.body.tipo).toBe('unaRealDoble');
    expect(res.body.raices).toEqual([-1, -1]);
    expect(res.body.vertice).toEqual({ x: -1, y: 0 });
  });

  it('POST /cuadratica/resolver con {1,0,1} responde 200 con D=-4, sinRaicesReales, raices null, vertice {0,1}', async () => {
    const res = await request(app.getHttpServer())
      .post('/cuadratica/resolver')
      .send({ a: 1, b: 0, c: 1 })
      .expect(200);

    expect(CuadraticaResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.discriminante).toBe(-4);
    expect(res.body.tipo).toBe('sinRaicesReales');
    expect(res.body.raices).toBeNull();
    expect(res.body.vertice).toEqual({ x: 0, y: 1 });
  });

  it('POST /cuadratica/resolver con a=0 responde 422 CUADRATICA_A_CERO', async () => {
    const res = await request(app.getHttpServer())
      .post('/cuadratica/resolver')
      .send({ a: 0, b: 2, c: 1 })
      .expect(422);

    expect(res.body.error.code).toBe('CUADRATICA_A_CERO');
    expect(res.body.error.message).toBeTruthy();
  });

  it('POST /cuadratica/resolver con a="x" responde 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/cuadratica/resolver')
      .send({ a: 'x', b: 2, c: 1 })
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
    expect(res.body.error.message).toBeTruthy();
  });

  it('POST /cuadratica/resolver con body vacío responde 400 ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/cuadratica/resolver')
      .send({})
      .expect(400);

    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });
});

describe('CuadraticaController (unitario)', () => {
  let controlador: CuadraticaController;
  let servicioMock: { resolver: jest.Mock };

  beforeEach(async () => {
    const respuestaMock: CuadraticaResponse = {
      discriminante: 1,
      tipo: 'dosReales',
      raices: [1, 2],
      vertice: { x: 1.5, y: -0.25 },
    };

    servicioMock = {
      resolver: jest.fn().mockReturnValue(respuestaMock),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [CuadraticaController],
      providers: [{ provide: CuadraticaService, useValue: servicioMock }],
    }).compile();

    controlador = modulo.get<CuadraticaController>(CuadraticaController);
  });

  it('delega en CuadraticaService.resolver y devuelve su valor', () => {
    const dto: CuadraticaRequest = { a: 1, b: -3, c: 2 };
    const resultado = controlador.resolver(dto);

    expect(servicioMock.resolver).toHaveBeenCalledTimes(1);
    expect(servicioMock.resolver).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual({
      discriminante: 1,
      tipo: 'dosReales',
      raices: [1, 2],
      vertice: { x: 1.5, y: -0.25 },
    });
  });
});

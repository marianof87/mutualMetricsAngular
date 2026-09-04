import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { EscenariosController } from './escenarios.controller';
import { EscenariosService } from './escenarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import { FiltroExcepcionesGlobal } from '../../comunes/filtros/filtro-excepciones.filtro';

describe('Escenarios (integración)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const FECHA = new Date('2026-09-03T18:00:00.000Z');
  const fila = {
    id: '11111111-1111-4111-8111-111111111111',
    usuarioId: 'usuario-1',
    tipo: 'cuadratica',
    inputs: JSON.stringify({ precioMinimo: 10, demanda: 0.8 }),
    outputs: JSON.stringify({ precioOptimo: 55.5 }),
    creadoEn: FECHA,
  };

  const prisma = {
    escenario: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'secreto-de-test' })],
      controllers: [EscenariosController],
      providers: [EscenariosService, JwtAuthGuard, { provide: PrismaService, useValue: prisma }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new FiltroExcepcionesGlobal());
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.escenario.create.mockReset();
    prisma.escenario.findMany.mockReset();
    prisma.escenario.count.mockReset();
    prisma.escenario.findFirst.mockReset();
    prisma.escenario.delete.mockReset();
  });

  const tokenDe = (sub: string) => jwt.sign({ sub, email: 'ana@example.com' });

  it('GET /escenarios sin token responde 401 con AUTH_TOKEN_INVALIDO', async () => {
    const res = await request(app.getHttpServer()).get('/escenarios').expect(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALIDO');
  });

  it('POST /escenarios con token y body válido responde 201 con EscenarioResponse sin usuarioId', async () => {
    prisma.escenario.create.mockResolvedValue(fila);
    const res = await request(app.getHttpServer())
      .post('/escenarios')
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .send({ tipo: 'cuadratica', inputs: { precioMinimo: 10, demanda: 0.8 }, outputs: { precioOptimo: 55.5 } })
      .expect(201);
    expect(res.body).toEqual({
      id: fila.id,
      tipo: 'cuadratica',
      inputs: { precioMinimo: 10, demanda: 0.8 },
      outputs: { precioOptimo: 55.5 },
      creadoEn: FECHA.toISOString(),
    });
    expect(res.body).not.toHaveProperty('usuarioId');
    expect(prisma.escenario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: 'usuario-1', tipo: 'cuadratica' }),
    });
    const args = prisma.escenario.create.mock.calls[0][0];
    expect(JSON.parse(args.data.inputs)).toEqual({ precioMinimo: 10, demanda: 0.8 });
  });

  it('POST /escenarios con body inválido responde 400 con ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/escenarios')
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .send({ tipo: 'chocotorta', inputs: [1, 2], outputs: {} })
      .expect(400);
    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('GET /escenarios con token responde 200 con Paginado', async () => {
    prisma.escenario.findMany.mockResolvedValue([fila]);
    prisma.escenario.count.mockResolvedValue(1);
    const res = await request(app.getHttpServer())
      .get('/escenarios?page=1&tamano=20')
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .expect(200);
    const esperado = {
      datos: [{ id: fila.id, tipo: 'cuadratica', inputs: { precioMinimo: 10, demanda: 0.8 }, outputs: { precioOptimo: 55.5 }, creadoEn: FECHA.toISOString() }],
      total: 1,
      pagina: 1,
      tamano: 20,
    };
    expect(res.body).toEqual(esperado);
  });

  it('GET /escenarios?tipo=cuadratica con token responde 200 y el servicio recibió el filtro', async () => {
    prisma.escenario.findMany.mockResolvedValue([fila]);
    prisma.escenario.count.mockResolvedValue(1);
    const res = await request(app.getHttpServer())
      .get('/escenarios?tipo=cuadratica')
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .expect(200);
    expect(res.body.datos).toHaveLength(1);
    expect(prisma.escenario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuarioId: 'usuario-1', tipo: 'cuadratica' } }),
    );
    expect(prisma.escenario.count).toHaveBeenCalledWith({
      where: { usuarioId: 'usuario-1', tipo: 'cuadratica' },
    });
  });

  it('GET /escenarios?tipo=invalido con token responde 400 con ENTRADA_INVALIDA', async () => {
    const res = await request(app.getHttpServer())
      .get('/escenarios?tipo=invalido')
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .expect(400);
    expect(res.body.error.code).toBe('ENTRADA_INVALIDA');
  });

  it('GET /escenarios/:id propio responde 200', async () => {
    prisma.escenario.findFirst.mockResolvedValue(fila);
    const res = await request(app.getHttpServer())
      .get(`/escenarios/${fila.id}`)
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .expect(200);
    expect(res.body.id).toBe(fila.id);
  });

  it('GET /escenarios/:id inexistente o ajeno responde 404 con ESCENARIOS_NO_ENCONTRADO', async () => {
    prisma.escenario.findFirst.mockResolvedValue(null);
    const res = await request(app.getHttpServer())
      .get(`/escenarios/${fila.id}`)
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .expect(404);
    expect(res.body.error.code).toBe('ESCENARIOS_NO_ENCONTRADO');
  });

  it('DELETE /escenarios/:id propio responde 204 sin body', async () => {
    prisma.escenario.findFirst.mockResolvedValue(fila);
    prisma.escenario.delete.mockResolvedValue(fila);
    await request(app.getHttpServer())
      .delete(`/escenarios/${fila.id}`)
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .expect(204);
  });

  it('DELETE /escenarios/:id inexistente o ajeno responde 404 con ESCENARIOS_NO_ENCONTRADO', async () => {
    prisma.escenario.findFirst.mockResolvedValue(null);
    const res = await request(app.getHttpServer())
      .delete(`/escenarios/${fila.id}`)
      .set('Authorization', `Bearer ${tokenDe('usuario-1')}`)
      .expect(404);
    expect(res.body.error.code).toBe('ESCENARIOS_NO_ENCONTRADO');
  });
});

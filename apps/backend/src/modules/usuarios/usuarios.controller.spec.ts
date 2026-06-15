import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import { FiltroExcepcionesGlobal } from '../../comunes/filtros/filtro-excepciones.filtro';

describe('Usuarios (integración)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const prisma = { usuario: { findUnique: jest.fn(), update: jest.fn() } };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'secreto-de-test' })],
      controllers: [UsuariosController],
      providers: [
        UsuariosService,
        JwtAuthGuard,
        { provide: PrismaService, useValue: prisma },
      ],
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
    prisma.usuario.findUnique.mockReset();
    prisma.usuario.update.mockReset();
  });

  const tokenDe = (sub: string) => jwt.sign({ sub, email: 'ana@example.com' });

  it('GET /usuarios/yo sin token responde 401 con AUTH_TOKEN_INVALIDO', async () => {
    const res = await request(app.getHttpServer()).get('/usuarios/yo').expect(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALIDO');
  });

  it('GET /usuarios/yo con token válido devuelve el usuario público', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      nombre: 'Ana',
      passwordHash: 'secreto',
    });

    const res = await request(app.getHttpServer())
      .get('/usuarios/yo')
      .set('Authorization', `Bearer ${tokenDe('u1')}`)
      .expect(200);

    expect(res.body).toEqual({ id: 'u1', email: 'ana@example.com', nombre: 'Ana' });
  });

  it('PATCH /usuarios/yo actualiza el nombre del usuario autenticado', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      nombre: 'Ana',
      passwordHash: 'secreto',
    });
    prisma.usuario.update.mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      nombre: 'Ana María',
      passwordHash: 'secreto',
    });

    const res = await request(app.getHttpServer())
      .patch('/usuarios/yo')
      .set('Authorization', `Bearer ${tokenDe('u1')}`)
      .send({ nombre: 'Ana María' })
      .expect(200);

    expect(res.body.nombre).toBe('Ana María');
  });

  it('PATCH /usuarios/yo con body inválido responde 400', async () => {
    await request(app.getHttpServer())
      .patch('/usuarios/yo')
      .set('Authorization', `Bearer ${tokenDe('u1')}`)
      .send({ nombre: '' })
      .expect(400);
  });
});

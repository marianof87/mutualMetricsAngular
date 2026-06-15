import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CodigoError } from '@mutual-metrics/shared';
import { AuthService } from './auth.service';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

describe('AuthService', () => {
  let servicio: AuthService;
  let prisma: { usuario: { findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = { usuario: { findUnique: jest.fn(), create: jest.fn() } };
    jwt = { sign: jest.fn().mockReturnValue('token.firmado') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    servicio = moduleRef.get(AuthService);
  });

  describe('registrar', () => {
    it('hashea la password y devuelve la sesión con el usuario público', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'u1', ...data }),
      );

      const sesion = await servicio.registrar({
        email: 'ana@example.com',
        password: 'unaClaveSegura',
        nombre: 'Ana',
      });

      expect(sesion.accessToken).toBe('token.firmado');
      expect(sesion.usuario).toEqual({ id: 'u1', email: 'ana@example.com', nombre: 'Ana' });

      const data = prisma.usuario.create.mock.calls[0][0].data;
      expect(data.passwordHash).not.toBe('unaClaveSegura');
      await expect(bcrypt.compare('unaClaveSegura', data.passwordHash)).resolves.toBe(true);
    });

    it('rechaza email ya registrado con AUTH_EMAIL_YA_REGISTRADO', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u1', email: 'ana@example.com' });

      const err = await servicio
        .registrar({ email: 'ana@example.com', password: 'unaClaveSegura', nombre: 'Ana' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ConflictException);
      expect((err as ConflictException).getResponse()).toMatchObject({
        code: CodigoError.AUTH_EMAIL_YA_REGISTRADO,
      });
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('devuelve la sesión con credenciales correctas', async () => {
      const passwordHash = await bcrypt.hash('unaClaveSegura', 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'ana@example.com',
        nombre: 'Ana',
        passwordHash,
      });

      const sesion = await servicio.login({ email: 'ana@example.com', password: 'unaClaveSegura' });

      expect(sesion.accessToken).toBe('token.firmado');
      expect(sesion.usuario.id).toBe('u1');
    });

    it('rechaza password incorrecta con AUTH_CREDENCIALES_INVALIDAS', async () => {
      const passwordHash = await bcrypt.hash('otraClave', 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'ana@example.com',
        nombre: 'Ana',
        passwordHash,
      });

      const err = await servicio
        .login({ email: 'ana@example.com', password: 'unaClaveSegura' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({
        code: CodigoError.AUTH_CREDENCIALES_INVALIDAS,
      });
    });

    it('rechaza email inexistente con AUTH_CREDENCIALES_INVALIDAS', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const err = await servicio
        .login({ email: 'noexiste@example.com', password: 'x' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(UnauthorizedException);
    });
  });
});

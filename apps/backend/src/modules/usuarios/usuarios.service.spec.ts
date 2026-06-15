import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CodigoError } from '@mutual-metrics/shared';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

describe('UsuariosService', () => {
  let servicio: UsuariosService;
  let prisma: { usuario: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = { usuario: { findUnique: jest.fn(), update: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [UsuariosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    servicio = moduleRef.get(UsuariosService);
  });

  describe('obtenerPorId', () => {
    it('devuelve la vista pública (sin passwordHash)', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'ana@example.com',
        nombre: 'Ana',
        passwordHash: 'secreto',
      });

      const usuario = await servicio.obtenerPorId('u1');

      expect(usuario).toEqual({ id: 'u1', email: 'ana@example.com', nombre: 'Ana' });
      expect(usuario).not.toHaveProperty('passwordHash');
    });

    it('lanza RECURSO_NO_ENCONTRADO si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const err = await servicio.obtenerPorId('inexistente').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(NotFoundException);
      expect((err as NotFoundException).getResponse()).toMatchObject({
        code: CodigoError.RECURSO_NO_ENCONTRADO,
      });
    });
  });

  describe('actualizar', () => {
    it('actualiza el nombre y devuelve la vista pública', async () => {
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

      const usuario = await servicio.actualizar('u1', { nombre: 'Ana María' });

      expect(usuario.nombre).toBe('Ana María');
      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { nombre: 'Ana María' },
      });
    });

    it('no actualiza si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(servicio.actualizar('inexistente', { nombre: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });
  });
});

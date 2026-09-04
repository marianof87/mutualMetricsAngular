import { NotFoundException } from '@nestjs/common';
import { CodigoError } from '@mutual-metrics/shared';
import { EscenariosService } from './escenarios.service';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

describe('EscenariosService', () => {
  let servicio: EscenariosService;
  let prisma: {
    escenario: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };

  const FECHA = new Date('2026-09-03T18:00:00.000Z');
  const usuarioId = 'usuario-1';
  const entrada = {
    tipo: 'cuadratica' as const,
    inputs: { precioMinimo: 10, demanda: 0.8 },
    outputs: { precioOptimo: 55.5 },
  };
  const fila = {
    id: '11111111-1111-4111-8111-111111111111',
    usuarioId,
    tipo: 'cuadratica' as const,
    inputs: JSON.stringify(entrada.inputs),
    outputs: JSON.stringify(entrada.outputs),
    creadoEn: FECHA,
  };

  beforeEach(() => {
    prisma = {
      escenario: {
        create: jest.fn().mockResolvedValue(fila),
        findMany: jest.fn().mockResolvedValue([fila]),
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue(fila),
        delete: jest.fn().mockResolvedValue(fila),
      },
    };
    servicio = new EscenariosService(prisma as unknown as PrismaService);
  });

  describe('crear', () => {
    it('llama a prisma.escenario.create con usuarioId y JSON.stringify de inputs/outputs', async () => {
      await servicio.crear(usuarioId, entrada);
      expect(prisma.escenario.create).toHaveBeenCalledWith({
        data: {
          usuarioId,
          tipo: entrada.tipo,
          inputs: JSON.stringify(entrada.inputs),
          outputs: JSON.stringify(entrada.outputs),
        },
      });
    });

    it('retorna EscenarioResponse parseado sin usuarioId y con creadoEn en ISO', async () => {
      const res = await servicio.crear(usuarioId, entrada);
      expect(res).toEqual({
        id: fila.id,
        tipo: fila.tipo,
        inputs: entrada.inputs,
        outputs: entrada.outputs,
        creadoEn: FECHA.toISOString(),
      });
      expect(res).not.toHaveProperty('usuarioId');
    });
  });

  describe('listar', () => {
    it('usa findMany con where usuarioId, skip/take y orderBy creadoEn desc, y count con mismo where', async () => {
      await servicio.listar(usuarioId, 2, 10);
      expect(prisma.escenario.findMany).toHaveBeenCalledWith({
        where: { usuarioId },
        skip: 10,
        take: 10,
        orderBy: { creadoEn: 'desc' },
      });
      expect(prisma.escenario.count).toHaveBeenCalledWith({ where: { usuarioId } });
    });

    it('devuelve Paginado con datos, total, pagina y tamano', async () => {
      const res = await servicio.listar(usuarioId, 1, 20);
      expect(res).toEqual({
        datos: [
          { id: fila.id, tipo: fila.tipo, inputs: entrada.inputs, outputs: entrada.outputs, creadoEn: FECHA.toISOString() },
        ],
        total: 1,
        pagina: 1,
        tamano: 20,
      });
    });

    it("con tipo: 'cuadratica' → findMany y count con where { usuarioId, tipo: 'cuadratica' }", async () => {
      await servicio.listar(usuarioId, 1, 20, 'cuadratica');
      expect(prisma.escenario.findMany).toHaveBeenCalledWith({
        where: { usuarioId, tipo: 'cuadratica' },
        skip: 0,
        take: 20,
        orderBy: { creadoEn: 'desc' },
      });
      expect(prisma.escenario.count).toHaveBeenCalledWith({ where: { usuarioId, tipo: 'cuadratica' } });
    });

    it('con tipo: undefined → where solo { usuarioId } (comportamiento actual)', async () => {
      await servicio.listar(usuarioId, 1, 20, undefined);
      expect(prisma.escenario.findMany).toHaveBeenCalledWith({
        where: { usuarioId },
        skip: 0,
        take: 20,
        orderBy: { creadoEn: 'desc' },
      });
      expect(prisma.escenario.count).toHaveBeenCalledWith({ where: { usuarioId } });
    });

    it("el filtro se combina con paginación: listar(usuarioId, 3, 5, 'pricing') → skip 10 take 5 where tipo pricing", async () => {
      await servicio.listar(usuarioId, 3, 5, 'pricing');
      expect(prisma.escenario.findMany).toHaveBeenCalledWith({
        where: { usuarioId, tipo: 'pricing' },
        skip: 10, // (3-1)*5
        take: 5,
        orderBy: { creadoEn: 'desc' },
      });
      expect(prisma.escenario.count).toHaveBeenCalledWith({ where: { usuarioId, tipo: 'pricing' } });
    });
  });

  describe('obtenerPorId', () => {
    it('usa findFirst con where id y usuarioId (scope correcto)', async () => {
      await servicio.obtenerPorId(usuarioId, fila.id);
      expect(prisma.escenario.findFirst).toHaveBeenCalledWith({ where: { id: fila.id, usuarioId } });
    });

    it('lanza NotFoundException con ESCENARIOS_NO_ENCONTRADO si no existe o es ajeno', async () => {
      prisma.escenario.findFirst.mockResolvedValue(null);
      await expect(servicio.obtenerPorId(usuarioId, fila.id)).rejects.toThrow(NotFoundException);
      try {
        await servicio.obtenerPorId(usuarioId, fila.id);
      } catch (e) {
        const resp = (e as NotFoundException).getResponse() as Record<string, unknown>;
        expect(resp['code']).toBe(CodigoError.ESCENARIOS_NO_ENCONTRADO);
      }
    });

    it('retorna EscenarioResponse parseado sin usuarioId si existe', async () => {
      const res = await servicio.obtenerPorId(usuarioId, fila.id);
      expect(res.id).toBe(fila.id);
      expect(res.inputs).toEqual(entrada.inputs);
      expect(res).not.toHaveProperty('usuarioId');
    });
  });

  describe('eliminar', () => {
    it('si findFirst es null lanza NotFoundException y no llama a delete', async () => {
      prisma.escenario.findFirst.mockResolvedValue(null);
      await expect(servicio.eliminar(usuarioId, fila.id)).rejects.toThrow(NotFoundException);
      expect(prisma.escenario.delete).not.toHaveBeenCalled();
      try {
        await servicio.eliminar(usuarioId, fila.id);
      } catch (e) {
        expect((e as NotFoundException).getResponse() as Record<string, unknown>).toHaveProperty('code', CodigoError.ESCENARIOS_NO_ENCONTRADO);
      }
    });

    it('si existe llama a prisma.escenario.delete con where id y resuelve void', async () => {
      await expect(servicio.eliminar(usuarioId, fila.id)).resolves.toBeUndefined();
      expect(prisma.escenario.delete).toHaveBeenCalledWith({ where: { id: fila.id } });
    });
  });

  describe('aPublico con JSON corrupto', () => {
    it('no lanza y devuelve {} para inputs corruptos', async () => {
      prisma.escenario.findFirst.mockResolvedValue({ ...fila, inputs: '{no-json', outputs: JSON.stringify(entrada.outputs) });
      const res = await servicio.obtenerPorId(usuarioId, fila.id);
      expect(res.inputs).toEqual({});
      expect(res.outputs).toEqual(entrada.outputs);
    });

    it('no lanza y devuelve {} para outputs corruptos', async () => {
      prisma.escenario.findFirst.mockResolvedValue({ ...fila, inputs: JSON.stringify(entrada.inputs), outputs: '{no-json' });
      const res = await servicio.obtenerPorId(usuarioId, fila.id);
      expect(res.outputs).toEqual({});
    });
  });
});

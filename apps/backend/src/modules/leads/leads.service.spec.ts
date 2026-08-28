import { LeadsService } from './leads.service';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

describe('LeadsService', () => {
  let servicio: LeadsService;
  let prismaMock: { lead: { create: jest.Mock } };

  beforeEach(() => {
    prismaMock = {
      lead: {
        create: jest.fn().mockResolvedValue({
          id: 'uuid-lead',
          recibidoEn: new Date('2026-01-01T00:00:00.000Z'),
        }),
      },
    };
    servicio = new LeadsService(prismaMock as unknown as PrismaService);
  });

  it('registra un lead y devuelve el id y recibidoEn en ISO', async () => {
    const resultado = await servicio.registrar({
      nombre: 'Ana Pérez',
      empresa: 'Textil Sur',
      whatsapp: '+5493515551234',
      email: 'ana@empresa.com',
    });

    expect(resultado).toEqual({
      id: 'uuid-lead',
      recibidoEn: '2026-01-01T00:00:00.000Z',
    });

    expect(prismaMock.lead.create).toHaveBeenCalledTimes(1);
    const llamada = prismaMock.lead.create.mock.calls[0][0];
    expect(llamada.data).toEqual({
      nombre: 'Ana Pérez',
      empresa: 'Textil Sur',
      whatsapp: '+5493515551234',
      email: 'ana@empresa.com',
    });
  });
});
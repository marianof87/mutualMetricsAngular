import { ContactoService } from './contacto.service';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

describe('ContactoService', () => {
  let servicio: ContactoService;
  let prismaMock: { contacto: { create: jest.Mock } };

  beforeEach(() => {
    prismaMock = {
      contacto: {
        create: jest.fn().mockResolvedValue({
          id: 'uuid-contacto',
          recibidoEn: new Date('2026-01-01T00:00:00.000Z'),
        }),
      },
    };
    servicio = new ContactoService(prismaMock as unknown as PrismaService);
  });

  it('persiste un mensaje de contacto y devuelve el id y recibidoEn en ISO', async () => {
    const resultado = await servicio.registrar({
      nombre: 'Juan Pérez',
      email: 'juan@empresa.com',
      mensaje: 'Quiero saber más sobre los escenarios de pricing.',
    });

    expect(resultado).toEqual({
      id: 'uuid-contacto',
      recibidoEn: '2026-01-01T00:00:00.000Z',
    });

    expect(prismaMock.contacto.create).toHaveBeenCalledTimes(1);
    const llamada = prismaMock.contacto.create.mock.calls[0][0];
    expect(llamada.data).toEqual({
      nombre: 'Juan Pérez',
      email: 'juan@empresa.com',
      mensaje: 'Quiero saber más sobre los escenarios de pricing.',
    });
  });
});
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const urlOriginal = process.env.DATABASE_URL;
  let spyConectar: jest.SpyInstance;
  let spyDesconectar: jest.SpyInstance;

  beforeAll(() => {
    process.env.DATABASE_URL = urlOriginal ?? 'file:./prueba.db';
  });

  afterAll(() => {
    if (urlOriginal) {
      process.env.DATABASE_URL = urlOriginal;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  beforeEach(() => {
    spyConectar = jest.spyOn(PrismaClient.prototype, '$connect').mockResolvedValue(undefined);
    spyDesconectar = jest.spyOn(PrismaClient.prototype, '$disconnect').mockResolvedValue(undefined);
  });

  afterEach(() => {
    spyConectar.mockRestore();
    spyDesconectar.mockRestore();
  });

  it('conecta a la base al inicializar el módulo', async () => {
    const servicio = new PrismaService();
    await servicio.onModuleInit();
    expect(spyConectar).toHaveBeenCalledTimes(1);
  });

  it('desconecta de la base al destruir el módulo', async () => {
    const servicio = new PrismaService();
    await servicio.onModuleDestroy();
    expect(spyDesconectar).toHaveBeenCalledTimes(1);
  });
});
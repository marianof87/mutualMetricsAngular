import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

describe('LeadsController', () => {
  let controller: LeadsController;

  beforeEach(async () => {
    const mockLeadsService = {
      registrar: jest.fn().mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        recibidoEn: new Date().toISOString(),
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        {
          provide: LeadsService,
          useValue: mockLeadsService,
        },
      ],
    }).compile();

    controller = moduleRef.get<LeadsController>(LeadsController);
  });

  it('debería registrar el lead correctamente', async () => {
    const dto = {
      nombre: 'Ana Pérez',
      empresa: 'Textil Sur',
      whatsapp: '+54 9 351 555-1234',
      email: 'ana.perez@empresa.com',
    };

    const resultado = await controller.registrar(dto);

    expect(resultado.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(resultado.recibidoEn).toString()).not.toBe('Invalid Date');
  });
});

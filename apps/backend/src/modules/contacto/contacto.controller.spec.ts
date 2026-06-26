import { Test, TestingModule } from '@nestjs/testing';
import { ContactoController } from './contacto.controller';
import { ContactoService } from './contacto.service';

describe('ContactoController', () => {
  let controller: ContactoController;

  beforeEach(async () => {
    // 1. Creamos un servicio falso que responde instantáneamente sin usar la base de datos
    const mockContactoService = {
      registrar: jest.fn().mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        recibidoEn: new Date().toISOString(),
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ContactoController],
      providers: [
        {
          provide: ContactoService,
          useValue: mockContactoService, // 2. Le inyectamos el servicio falso
        },
      ],
    }).compile();

    controller = moduleRef.get<ContactoController>(ContactoController);
  });

  it('debería enviar el contacto correctamente', async () => {
    const dto = {
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      mensaje: 'Quisiera más información sobre el sistema, gracias.',
    };
    
    const resultado = await controller.enviar(dto); 
  
    expect(resultado.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(resultado.recibidoEn).toString()).not.toBe('Invalid Date');
  });
});
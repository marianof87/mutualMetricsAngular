import { Test, TestingModule } from '@nestjs/testing';
import { ContactoController } from './contacto.controller';
import { ContactoService } from './contacto.service';

describe('ContactoController', () => {
  let controller: ContactoController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ContactoController],
      providers: [ContactoService],
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
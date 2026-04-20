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

  it('registra un contacto válido y devuelve id + recibidoEn', () => {
    const dto = {
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      mensaje: 'Quisiera más información sobre el sistema, gracias.',
    };
    const resultado = controller.enviar(dto);
    expect(resultado.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(resultado.recibidoEn).toString()).not.toBe('Invalid Date');
  });
});

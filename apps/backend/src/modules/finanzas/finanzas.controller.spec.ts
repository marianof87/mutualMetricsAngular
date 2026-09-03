import { Test, TestingModule } from '@nestjs/testing';
import { FinanzasController } from './finanzas.controller';
import { FinanzasService } from './finanzas.service';

describe('FinanzasController', () => {
  let controller: FinanzasController;
  let serviceMock: {
    interesSimple: jest.Mock;
    interesCompuesto: jest.Mock;
    roi: jest.Mock;
    van: jest.Mock;
    tir: jest.Mock;
  };

  beforeEach(async () => {
    serviceMock = {
      interesSimple: jest.fn().mockReturnValue({ interes: 100, total: 1100 }),
      interesCompuesto: jest.fn().mockReturnValue({ interes: 210, total: 1210 }),
      roi: jest.fn().mockReturnValue({ roi: 50 }),
      van: jest.fn().mockReturnValue({ van: 243.43 }),
      tir: jest.fn().mockReturnValue({ tir: 0.1 }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FinanzasController],
      providers: [{ provide: FinanzasService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get<FinanzasController>(FinanzasController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('POST /finanzas/interes-simple delega en service.interesSimple y devuelve su valor', () => {
    const dto = { principal: 1000, tasa: 0.05, tiempo: 2 };
    const esperado = { interes: 100, total: 1100 };
    serviceMock.interesSimple.mockReturnValue(esperado);

    const resultado = controller.interesSimple(dto);

    expect(serviceMock.interesSimple).toHaveBeenCalledTimes(1);
    expect(serviceMock.interesSimple).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(esperado);
  });

  it('POST /finanzas/interes-compuesto delega en service.interesCompuesto', () => {
    const dto = { principal: 1000, tasa: 0.1, tiempo: 2, frecuencia: 1 };
    const esperado = { interes: 210, total: 1210 };
    serviceMock.interesCompuesto.mockReturnValue(esperado);

    const resultado = controller.interesCompuesto(dto);

    expect(serviceMock.interesCompuesto).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(esperado);
  });

  it('POST /finanzas/roi delega en service.roi', () => {
    const dto = { inversion: 1000, beneficio: 1500 };
    const esperado = { roi: 50 };
    serviceMock.roi.mockReturnValue(esperado);

    const resultado = controller.roi(dto);

    expect(serviceMock.roi).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(esperado);
  });

  it('POST /finanzas/van delega en service.van', () => {
    const dto = { tasa: 0.1, inversionInicial: -1000, flujos: [500, 500, 500] };
    const esperado = { van: 243.43 };
    serviceMock.van.mockReturnValue(esperado);

    const resultado = controller.van(dto);

    expect(serviceMock.van).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(esperado);
  });

  it('POST /finanzas/tir delega en service.tir', () => {
    const dto = { inversionInicial: -1000, flujos: [1100] };
    const esperado = { tir: 0.1 };
    serviceMock.tir.mockReturnValue(esperado);

    const resultado = controller.tir(dto);

    expect(serviceMock.tir).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual(esperado);
  });
});

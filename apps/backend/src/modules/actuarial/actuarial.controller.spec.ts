import { Test, TestingModule } from '@nestjs/testing';
import { ActuarialController } from './actuarial.controller';
import { ActuarialService } from './actuarial.service';
import type {
  SimulacionActuarialRequest,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';

describe('ActuarialController', () => {
  let controlador: ActuarialController;

  beforeEach(async () => {
    const respuestaMock: SimulacionActuarialResponse = {
      nSimulaciones: 10000,
      semilla: 42,
      muestrasInvalidas: 0,
      nivelConfianza: 0.95,
      precioOptimo: {
        media: 30,
        mediana: 30,
        desvio: 0.5,
        percentiles: { '5': 29, '50': 30, '95': 31 },
        intervalo: { minimo: 29.05, maximo: 30.95 },
      },
      gananciaMaxima: {
        media: 800,
        mediana: 800,
        desvio: 22,
        percentiles: { '5': 765, '50': 800, '95': 835 },
        intervalo: { minimo: 765, maximo: 835 },
      },
      puntoEquilibrio: {
        media: 10,
        mediana: 10,
        desvio: 0.2,
        percentiles: { '5': 9.7, '50': 10, '95': 10.3 },
        intervalo: { minimo: 9.7, maximo: 10.3 },
      },
      pisoSolvencia: 10.2,
      probabilidadPerdida: { enPrecioOptimo: 0, enPrecioActual: 0 },
      curvaRiesgo: [{ precio: 10, probabilidadPerdida: 0 }],
      advertencias: [],
    };

    const servicioMock = {
      simularRiesgo: jest.fn().mockReturnValue(respuestaMock),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [ActuarialController],
      providers: [{ provide: ActuarialService, useValue: servicioMock }],
    }).compile();

    controlador = modulo.get<ActuarialController>(ActuarialController);
  });

  it('delegar en el servicio y devolver el resultado de la simulación', () => {
    const solicitud: SimulacionActuarialRequest = {
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: 120,
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 10000,
      nivelConfianza: 0.95,
      semilla: 42,
    };

    const resultado = controlador.simular(solicitud);

    expect(resultado.nSimulaciones).toBe(10000);
    expect(resultado.precioOptimo.intervalo).toEqual({ minimo: 29.05, maximo: 30.95 });
    expect(resultado.pisoSolvencia).toBe(10.2);
  });
});
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CodigoError } from '@mutual-metrics/shared';
import { ActuarialService } from './actuarial.service';

describe('ActuarialService', () => {
  let servicio: ActuarialService;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [ActuarialService],
    }).compile();

    servicio = modulo.get<ActuarialService>(ActuarialService);
  });

  it('rechaza una solicitud sin incertidumbre con el código SIMULACION_SIN_INCERTIDUMBRE', () => {
    expect(() =>
      servicio.simularRiesgo({
        coeficienteA: { tipo: 'fijo', valor: -2 },
        coeficienteB: 120,
        coeficienteC: { tipo: 'fijo', valor: -1000 },
        precioMinimo: 10,
        precioMaximo: 100,
        nSimulaciones: 500,
        nivelConfianza: 0.95,
        semilla: 1,
      }),
    ).toThrow(
      new BadRequestException({
        code: CodigoError.SIMULACION_SIN_INCERTIDUMBRE,
        message: 'Al menos un coeficiente debe ser estocástico para simular riesgo.',
      }),
    );
  });

  it('delega al dominio y devuelve la simulación cuando hay incertidumbre', () => {
    const resultado = servicio.simularRiesgo({
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
      coeficienteB: 120,
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
      nSimulaciones: 1000,
      nivelConfianza: 0.95,
      semilla: 9,
    });

    expect(resultado.nSimulaciones).toBe(1000);
    expect(resultado.semilla).toBe(9);
    expect(resultado.precioOptimo.media).toBeGreaterThan(0);
    expect(Array.isArray(resultado.curvaRiesgo)).toBe(true);
    expect(resultado.curvaRiesgo.length).toBeGreaterThan(10);
  });
});
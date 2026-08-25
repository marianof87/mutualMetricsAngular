import { Test, TestingModule } from '@nestjs/testing';
import { ActuarialPersistenciaService } from './actuarial-persistencia.service';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import type { SimulacionActuarialRequest, SimulacionActuarialResponse } from '@mutual-metrics/shared';

describe('ActuarialPersistenciaService', () => {
  let servicio: ActuarialPersistenciaService;
  let prismaMock: { simulacionActuarial: { create: jest.Mock } };

  const solicitudMock: SimulacionActuarialRequest = {
    coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
    coeficienteB: { tipo: 'fijo', valor: 120 },
    coeficienteC: { tipo: 'fijo', valor: -1000 },
    precioMinimo: 10,
    precioMaximo: 100,
    nSimulaciones: 5000,
    nivelConfianza: 0.95,
    semilla: 42,
  };

  const resultadoMock: SimulacionActuarialResponse = {
    nSimulaciones: 5000,
    semilla: 42,
    muestrasInvalidas: 0,
    nivelConfianza: 0.95,
    precioOptimo: {
      media: 30,
      mediana: 30,
      desvio: 0.5,
      percentiles: { '5': 29.1, '50': 30, '95': 30.9 },
      intervalo: { minimo: 29.05, maximo: 30.95 },
    },
    gananciaMaxima: {
      media: 800,
      mediana: 800,
      desvio: 22,
      percentiles: {},
      intervalo: { minimo: 765, maximo: 835 },
    },
    puntoEquilibrio: {
      media: 10,
      mediana: 10,
      desvio: 0.2,
      percentiles: {},
      intervalo: { minimo: 9.7, maximo: 10.3 },
    },
    pisoSolvencia: 10.2,
    probabilidadPerdida: { enPrecioOptimo: 0, enPrecioActual: 0.05 },
    curvaRiesgo: [],
    advertencias: [],
  };

  beforeEach(async () => {
    prismaMock = {
      simulacionActuarial: {
        create: jest.fn().mockResolvedValue({ id: 'uuid-falso' }),
      },
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        ActuarialPersistenciaService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    servicio = modulo.get<ActuarialPersistenciaService>(ActuarialPersistenciaService);
  });

  it('guarda la simulación con los campos resumidos y devuelve el id', async () => {
    const resultado = await servicio.guardar({
      solicitud: solicitudMock,
      resultado: resultadoMock,
      leadId: 'uuid-lead',
    });

    expect(resultado.id).toBe('uuid-falso');
    expect(prismaMock.simulacionActuarial.create).toHaveBeenCalledTimes(1);

    const llamada = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamada.data.leadId).toBe('uuid-lead');
    expect(llamada.data.coeficienteBTipo).toBe('fijo');
    expect(llamada.data.nSimulaciones).toBe(5000);
    expect(llamada.data.precioOptimoMedia).toBe(30);
    expect(llamada.data.pisoSolvencia).toBe(10.2);
    expect(llamada.data.probPerdidaOptimo).toBe(0);
    expect(llamada.data.probPerdidaActual).toBe(0.05);
  });

  it('marca coeficienteBTipo como estocástico cuando B no es fijo', async () => {
    const solicitudEstocastica = {
      ...solicitudMock,
      coeficienteB: { tipo: 'triangular' as const, minimo: 100, moda: 120, maximo: 140 },
    };

    await servicio.guardar({
      solicitud: solicitudEstocastica,
      resultado: resultadoMock,
    });

    const llamada = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamada.data.coeficienteBTipo).toBe('estocástico');
  });

  it('acepta leadId undefined (simulación anónima)', async () => {
    await servicio.guardar({
      solicitud: solicitudMock,
      resultado: resultadoMock,
    });

    const llamada = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamada.data.leadId).toBeNull();
  });
});

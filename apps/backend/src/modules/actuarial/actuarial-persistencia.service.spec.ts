import { Test, TestingModule } from '@nestjs/testing';
import { ActuarialPersistenciaService } from './actuarial-persistencia.service';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import type { SimulacionActuarialRequest, SimulacionActuarialResponse } from '@mutual-metrics/shared';

describe('ActuarialPersistenciaService', () => {
  let servicio: ActuarialPersistenciaService;
  let prismaMock: {
    simulacionActuarial: { create: jest.Mock };
    lead: { create: jest.Mock };
    $transaction: jest.Mock;
  };

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
      lead: {
        create: jest.fn().mockResolvedValue({ id: 'uuid-lead-nuevo' }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          lead: prismaMock.lead,
          simulacionActuarial: prismaMock.simulacionActuarial,
        }),
      ),
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

  it('guarda desde resumen (guardarDesdeResumen) con payload Zod directo', async () => {
    const payload = {
      leadId: 'uuid-lead-2',
      coeficienteBTipo: 'estocástico' as const,
      nSimulaciones: 10000,
      nivelConfianza: 0.95,
      precioOptimoMedia: 30,
      precioOptimoP5: 28,
      precioOptimoP95: 32,
      pisoSolvencia: 10.2,
      probPerdidaOptimo: 0.05,
      probPerdidaActual: 0.1,
    };

    const resultado = await servicio.guardarDesdeResumen(payload);

    expect(resultado.id).toBe('uuid-falso');
    expect(prismaMock.simulacionActuarial.create).toHaveBeenCalledTimes(1);

    const llamada = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamada.data.leadId).toBe('uuid-lead-2');
    expect(llamada.data.coeficienteBTipo).toBe('estocástico');
    expect(llamada.data.nSimulaciones).toBe(10000);
    expect(llamada.data.precioOptimoP5).toBe(28);
    expect(llamada.data.precioOptimoP95).toBe(32);
  });

  it('usa intervalo.minimo/maximo como fallback cuando percentiles están vacíos', async () => {
    const resultadoSinPercentiles: SimulacionActuarialResponse = {
      ...resultadoMock,
      precioOptimo: {
        media: 30,
        mediana: 30,
        desvio: 0.5,
        percentiles: {},
        intervalo: { minimo: 28, maximo: 32 },
      },
    };

    await servicio.guardar({
      solicitud: solicitudMock,
      resultado: resultadoSinPercentiles,
    });

    const llamada = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamada.data.precioOptimoP5).toBe(28);
    expect(llamada.data.precioOptimoP95).toBe(32);
  });

  it('guarda como null probPerdidaActual cuando no hay precio actual', async () => {
    const resultadoSinPrecioActual: SimulacionActuarialResponse = {
      ...resultadoMock,
      probabilidadPerdida: { enPrecioOptimo: 0.03, enPrecioActual: null },
    };

    await servicio.guardar({
      solicitud: solicitudMock,
      resultado: resultadoSinPrecioActual,
    });

    const llamada = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamada.data.probPerdidaActual).toBeNull();
  });

  it('guarda desde resumen sin leadId (simulación anónima)', async () => {
    const payload = {
      leadId: undefined,
      coeficienteBTipo: 'fijo' as const,
      nSimulaciones: 10000,
      nivelConfianza: 0.95,
      precioOptimoMedia: 30,
      precioOptimoP5: 28,
      precioOptimoP95: 32,
      pisoSolvencia: null,
      probPerdidaOptimo: 0.05,
      probPerdidaActual: null,
    };

    const resultado = await servicio.guardarDesdeResumen(payload);

    expect(resultado.id).toBe('uuid-falso');
    const llamada = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamada.data.leadId).toBeNull();
    expect(llamada.data.pisoSolvencia).toBeNull();
    expect(llamada.data.probPerdidaActual).toBeNull();
  });

  it('crea lead y simulación en una sola transacción cuando viene lead embebido', async () => {
    const payload = {
      lead: {
        nombre: 'Ana Pérez',
        empresa: 'Textil Sur',
        whatsapp: '+54 9 351 555-1234',
        email: 'ana@empresa.com',
      },
      coeficienteBTipo: 'fijo' as const,
      nSimulaciones: 5000,
      nivelConfianza: 0.95,
      precioOptimoMedia: 30,
      precioOptimoP5: 28,
      precioOptimoP95: 32,
      pisoSolvencia: 10.2,
      probPerdidaOptimo: 0.05,
      probPerdidaActual: 0.1,
    };

    const resultado = await servicio.guardarDesdeResumen(payload);

    expect(resultado).toEqual({ id: 'uuid-falso', leadId: 'uuid-lead-nuevo' });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    const llamadaLead = prismaMock.lead.create.mock.calls[0][0];
    expect(llamadaLead.data).toEqual({
      nombre: 'Ana Pérez',
      empresa: 'Textil Sur',
      whatsapp: '+54 9 351 555-1234',
      email: 'ana@empresa.com',
    });

    const llamadaSimulacion = prismaMock.simulacionActuarial.create.mock.calls[0][0];
    expect(llamadaSimulacion.data.leadId).toBe('uuid-lead-nuevo');
    expect(llamadaSimulacion.data.coeficienteBTipo).toBe('fijo');
    expect(llamadaSimulacion.data.nSimulaciones).toBe(5000);
  });
});

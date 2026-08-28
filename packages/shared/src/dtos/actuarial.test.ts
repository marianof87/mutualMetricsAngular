import { describe, it, expect } from 'vitest';
import {
  SimulacionActuarialRequestSchema,
  SimulacionActuarialResponseSchema,
  GuardarSimulacionActuarialSchema,
} from './actuarial';

const solicitudValida = {
  coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
  coeficienteB: { tipo: 'fijo', valor: 120 },
  coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
  precioMinimo: 10,
  precioMaximo: 100,
  precioActual: 30,
  nSimulaciones: 10000,
  nivelConfianza: 0.95,
  semilla: 42,
};

describe('SimulacionActuarialRequestSchema', () => {
  it('acepta una solicitud completa y válida', () => {
    const resultado = SimulacionActuarialRequestSchema.safeParse(solicitudValida);
    expect(resultado.success).toBe(true);
  });

  it('aplica los defaults de nSimulaciones y nivelConfianza', () => {
    const { nSimulaciones, nivelConfianza } = SimulacionActuarialRequestSchema.parse({
      coeficienteA: { tipo: 'fijo', valor: -2 },
      coeficienteB: { tipo: 'fijo', valor: 120 },
      coeficienteC: { tipo: 'fijo', valor: -1000 },
      precioMinimo: 10,
      precioMaximo: 100,
    });
    expect(nSimulaciones).toBe(10000);
    expect(nivelConfianza).toBe(0.95);
  });

  it('aplica el default de nivelConfianza del parámetro normal', () => {
    const resultado = SimulacionActuarialRequestSchema.parse(solicitudValida);
    const c = resultado.coeficienteC;
    if (c.tipo === 'normal') expect(c.nivelConfianza).toBe(0.9);
  });

  it('rechaza minimo >= maximo en un parámetro estocástico', () => {
    const resultado = SimulacionActuarialRequestSchema.safeParse({
      ...solicitudValida,
      coeficienteA: { tipo: 'triangular', minimo: -1, moda: -2, maximo: -3 },
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza moda fuera del rango [minimo, maximo]', () => {
    const resultado = SimulacionActuarialRequestSchema.safeParse({
      ...solicitudValida,
      coeficienteA: { tipo: 'triangular', minimo: -3, moda: -4, maximo: -1 },
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza precios negativos', () => {
    const conMinimoNegativo = SimulacionActuarialRequestSchema.safeParse({
      ...solicitudValida,
      precioMinimo: -1,
    });
    expect(conMinimoNegativo.success).toBe(false);

    const conMaximoNegativo = SimulacionActuarialRequestSchema.safeParse({
      ...solicitudValida,
      precioMaximo: -10,
    });
    expect(conMaximoNegativo.success).toBe(false);
  });

  it('rechaza nSimulaciones fuera del rango [100, 25000]', () => {
    const nChico = SimulacionActuarialRequestSchema.safeParse({ ...solicitudValida, nSimulaciones: 99 });
    expect(nChico.success).toBe(false);

    const nGrande = SimulacionActuarialRequestSchema.safeParse({
      ...solicitudValida,
      nSimulaciones: 25001,
    });
    expect(nGrande.success).toBe(false);
  });

  it('rechaza nivelConfianza fuera del rango [0.8, 0.99]', () => {
    const bajo = SimulacionActuarialRequestSchema.safeParse({ ...solicitudValida, nivelConfianza: 0.5 });
    expect(bajo.success).toBe(false);

    const alto = SimulacionActuarialRequestSchema.safeParse({ ...solicitudValida, nivelConfianza: 0.999 });
    expect(alto.success).toBe(false);
  });

  it('rechaza una semilla no entera o negativa', () => {
    const decimal = SimulacionActuarialRequestSchema.safeParse({ ...solicitudValida, semilla: 1.5 });
    expect(decimal.success).toBe(false);

    const negativa = SimulacionActuarialRequestSchema.safeParse({ ...solicitudValida, semilla: -1 });
    expect(negativa.success).toBe(false);
  });

  it('rechaza un tipo de parámetro desconocido', () => {
    const resultado = SimulacionActuarialRequestSchema.safeParse({
      ...solicitudValida,
      coeficienteA: { tipo: 'lognormal', media: 1 },
    });
    expect(resultado.success).toBe(false);
  });
});

describe('GuardarSimulacionActuarialSchema', () => {
  const payloadValido = {
    leadId: '550e8400-e29b-41d4-a716-446655440000',
    coeficienteBTipo: 'fijo' as const,
    nSimulaciones: 10000,
    nivelConfianza: 0.95,
    precioOptimoMedia: 30,
    precioOptimoP5: 29.1,
    precioOptimoP95: 30.9,
    pisoSolvencia: 10.2,
    probPerdidaOptimo: 0.05,
    probPerdidaActual: 0.15,
  };

  it('acepta un payload completo y válido', () => {
    const resultado = GuardarSimulacionActuarialSchema.safeParse(payloadValido);
    expect(resultado.success).toBe(true);
  });

  it('acepta leadId omitido (simulación anónima)', () => {
    const { leadId: _, ...sinLeadId } = payloadValido;
    const resultado = GuardarSimulacionActuarialSchema.safeParse(sinLeadId);
    expect(resultado.success).toBe(true);
  });

  it('rechaza probPerdidaOptimo mayor a 1', () => {
    const resultado = GuardarSimulacionActuarialSchema.safeParse({
      ...payloadValido,
      probPerdidaOptimo: 1.5,
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza probPerdidaOptimo negativa', () => {
    const resultado = GuardarSimulacionActuarialSchema.safeParse({
      ...payloadValido,
      probPerdidaOptimo: -0.1,
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza leadId que no sea UUID válido', () => {
    const resultado = GuardarSimulacionActuarialSchema.safeParse({
      ...payloadValido,
      leadId: 'no-es-uuid',
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza coeficienteBTipo con valor no permitido', () => {
    const resultado = GuardarSimulacionActuarialSchema.safeParse({
      ...payloadValido,
      coeficienteBTipo: 'invalido',
    });
    expect(resultado.success).toBe(false);
  });

  it('acepta pisoSolvencia null', () => {
    const resultado = GuardarSimulacionActuarialSchema.safeParse({
      ...payloadValido,
      pisoSolvencia: null,
    });
    expect(resultado.success).toBe(true);
  });

  it('acepta probPerdidaActual null', () => {
    const resultado = GuardarSimulacionActuarialSchema.safeParse({
      ...payloadValido,
      probPerdidaActual: null,
    });
    expect(resultado.success).toBe(true);
  });
});

describe('SimulacionActuarialResponseSchema', () => {
  it('acepta una respuesta completa con pisoSolvencia y precioActual', () => {
    const respuesta = {
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
      curvaRiesgo: [
        { precio: 10, probabilidadPerdida: 0 },
        { precio: 100, probabilidadPerdida: 1 },
      ],
      advertencias: [],
    };
    const resultado = SimulacionActuarialResponseSchema.safeParse(respuesta);
    expect(resultado.success).toBe(true);
  });

  it('acepta pisoSolvencia null y enPrecioActual null', () => {
    const respuesta = {
      nSimulaciones: 100,
      semilla: 1,
      muestrasInvalidas: 0,
      nivelConfianza: 0.95,
      precioOptimo: {
        media: 0,
        mediana: 0,
        desvio: 0,
        percentiles: {},
        intervalo: { minimo: 0, maximo: 0 },
      },
      gananciaMaxima: {
        media: 0,
        mediana: 0,
        desvio: 0,
        percentiles: {},
        intervalo: { minimo: 0, maximo: 0 },
      },
      puntoEquilibrio: {
        media: 0,
        mediana: 0,
        desvio: 0,
        percentiles: {},
        intervalo: { minimo: 0, maximo: 0 },
      },
      pisoSolvencia: null,
      probabilidadPerdida: { enPrecioOptimo: 0, enPrecioActual: null },
      curvaRiesgo: [],
      advertencias: ['sin piso solvente'],
    };
    const resultado = SimulacionActuarialResponseSchema.safeParse(respuesta);
    expect(resultado.success).toBe(true);
  });
});
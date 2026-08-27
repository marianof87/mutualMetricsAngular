import { TestBed } from '@angular/core/testing';
import type { SimulacionActuarialResponse } from '@mutual-metrics/shared';
import {
  InformeActuarialPdfService,
  type DatosInformeActuarial,
} from './informe-actuarial-pdf.service';

const resultadoMock: SimulacionActuarialResponse = {
  nSimulaciones: 1000,
  semilla: 42,
  muestrasInvalidas: 3,
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
  probabilidadPerdida: { enPrecioOptimo: 0.05, enPrecioActual: 0.15 },
  curvaRiesgo: [
    { precio: 10, probabilidadPerdida: 0 },
    { precio: 100, probabilidadPerdida: 1 },
  ],
  advertencias: ['Intervalo amplio: mejorá la estimación de A.'],
};

const datosMock: DatosInformeActuarial = {
  lead: {
    nombre: 'Ana Pérez',
    empresa: 'Textil Sur',
    whatsapp: '+54 9 351 555-1234',
    email: 'ana@empresa.com',
  },
  resultado: resultadoMock,
  coeficienteBTipo: 'fijo',
};

describe('InformeActuarialPdfService', () => {
  let servicio: InformeActuarialPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(InformeActuarialPdfService);
  });

  it('genera bytes válidos de PDF sin tocar el DOM', async () => {
    const bytes = await servicio.generarBytes(datosMock);

    expect(bytes.length).toBeGreaterThan(100);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toMatch(/^%PDF/);
  });

  it('genera bytes con valores de respaldo cuando faltan percentiles (fallback al intervalo)', async () => {
    const sinPercentiles: DatosInformeActuarial = {
      ...datosMock,
      resultado: {
        ...resultadoMock,
        precioOptimo: {
          media: 30,
          mediana: 30,
          desvio: 0.5,
          percentiles: {},
          intervalo: { minimo: 28, maximo: 32 },
        },
      },
    };

    const bytes = await servicio.generarBytes(sinPercentiles);

    expect(bytes.length).toBeGreaterThan(100);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toMatch(/^%PDF/);
  });
});
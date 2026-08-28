import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import type {
  GuardarSimulacionActuarial,
  SimulacionActuarialRequest,
} from '@mutual-metrics/shared';
import { ActuarialService } from './actuarial.service';
import { entorno } from '../../core/configuracion/entorno';

describe('ActuarialService', () => {
  let servicio: ActuarialService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActuarialService, provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ActuarialService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  const solicitud: SimulacionActuarialRequest = {
    coeficienteA: { tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 },
    coeficienteB: { tipo: 'fijo', valor: 120 },
    coeficienteC: { tipo: 'normal', minimo: -1100, maximo: -900, nivelConfianza: 0.9 },
    precioMinimo: 10,
    precioMaximo: 100,
    nSimulaciones: 10000,
    nivelConfianza: 0.95,
  };

  it('hace POST a la URL del entorno con el cuerpo de la solicitud', () => {
    servicio.simular(solicitud).subscribe();

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/actuarial/simulaciones`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(solicitud);
    peticion.flush({
      nSimulaciones: 10000,
      semilla: 42,
      muestrasInvalidas: 0,
      nivelConfianza: 0.95,
      precioOptimo: {
        media: 30,
        mediana: 30,
        desvio: 0.5,
        percentiles: {},
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
      probabilidadPerdida: { enPrecioOptimo: 0, enPrecioActual: null },
      curvaRiesgo: [],
      advertencias: [],
    });
  });

  it('hace POST a guardar con el payload del resumen y devuelve el id', async () => {
    const payload: GuardarSimulacionActuarial = {
      leadId: undefined,
      coeficienteBTipo: 'fijo',
      nSimulaciones: 1000,
      nivelConfianza: 0.95,
      precioOptimoMedia: 30,
      precioOptimoP5: 28,
      precioOptimoP95: 32,
      pisoSolvencia: 10.2,
      probPerdidaOptimo: 0.05,
      probPerdidaActual: 0.1,
    };

    servicio.guardar(payload).subscribe((res) => {
      expect(res.id).toBe('uuid-falso');
      expect(res.leadId).toBe('uuid-lead');
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/actuarial/simulaciones/guardar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(payload);
    peticion.flush({ id: 'uuid-falso', leadId: 'uuid-lead' });
  });
});
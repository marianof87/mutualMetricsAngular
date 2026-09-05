import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodigoError, type CuadraticaRequest, type CuadraticaResponse } from '@mutual-metrics/shared';
import { CuadraticaService } from './cuadratica.service';
import { entorno } from '../../core/configuracion/entorno';

describe('CuadraticaService', () => {
  let servicio: CuadraticaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CuadraticaService, provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(CuadraticaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  const dto: CuadraticaRequest = { a: 1, b: -5, c: 6 };

  const respuestaMock: CuadraticaResponse = {
    discriminante: 1,
    tipo: 'dosReales',
    raices: [3, 2],
    vertice: { x: 2.5, y: -0.25 },
  };

  it('resolver() hace POST a `${entorno.apiBaseUrl}/cuadratica/resolver` con el dto y devuelve CuadraticaResponse', () => {
    servicio.resolver(dto).subscribe((res) => {
      expect(res).toEqual(respuestaMock);
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/cuadratica/resolver`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(dto);
    expect(peticion.request.headers.get('Content-Type') ?? 'application/json').toContain('application/json');
    peticion.flush(respuestaMock);
  });

  it('propaga error 422 con envelope CUADRATICA_A_CERO', async () => {
    const envelope = {
      error: { code: CodigoError.CUADRATICA_A_CERO, message: "El coeficiente 'a' no puede ser cero" },
    };

    const promesa = new Promise<unknown>((resolve) => {
      servicio.resolver(dto).subscribe({
        error: (e) => resolve(e),
      });
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/cuadratica/resolver`);
    peticion.flush(envelope, { status: 422, statusText: 'Unprocessable Entity' });

    const error = (await promesa) as { error?: typeof envelope };
    // Sin erroresInterceptor registrado, el service emite el HttpErrorResponse crudo;
    // su propiedad `.error` es el cuerpo (envelope) devuelto por el backend.
    expect(error.error).toEqual(envelope);
  });

  it('propaga error 400 con envelope ENTRADA_INVALIDA', async () => {
    const envelope = { error: { code: CodigoError.ENTRADA_INVALIDA, message: 'Entrada inválida' } };

    const promesa = new Promise<unknown>((resolve) => {
      servicio.resolver({ a: 0, b: 0, c: 0 }).subscribe({
        error: (e) => resolve(e),
      });
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/cuadratica/resolver`);
    peticion.flush(envelope, { status: 400, statusText: 'Bad Request' });

    const error = (await promesa) as { error?: typeof envelope };
    // HttpErrorResponse crudo → `.error.error.code` es el código del envelope.
    expect(error.error?.error.code).toBe(CodigoError.ENTRADA_INVALIDA);
  });

  it('caída de red (status 0) no se traga: el observable falla con HttpErrorResponse status 0', async () => {
    const promesa = new Promise<unknown>((resolve) => {
      servicio.resolver(dto).subscribe({
        error: (e) => resolve(e),
      });
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/cuadratica/resolver`);
    peticion.error(new ProgressEvent('error'), { status: 0, statusText: '' });

    const error = (await promesa) as { status: number };
    // El service deja pasar el error crudo; erroresInterceptor lo mapea a SERVICIO_NO_DISPONIBLE.
    expect(error.status).toBe(0);
  });
});

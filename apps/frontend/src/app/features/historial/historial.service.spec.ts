import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import type { Paginado, EscenarioResponse } from '@mutual-metrics/shared';
import { HistorialService } from './historial.service';
import { entorno } from '../../core/configuracion/entorno';

describe('HistorialService', () => {
  let servicio: HistorialService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HistorialService, provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(HistorialService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('listar hace GET a /escenarios con params page y tamano', () => {
    const respuesta: Paginado<EscenarioResponse> = {
      datos: [],
      total: 0,
      pagina: 1,
      tamano: 20,
    };
    servicio.listar(2, 20).subscribe((res) => {
      expect(res).toEqual(respuesta);
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/escenarios?page=2&tamano=20`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('page')).toBe('2');
    expect(peticion.request.params.get('tamano')).toBe('20');
    peticion.flush(respuesta);
  });

  it('listar usa valores por defecto page=1 y tamano=20', () => {
    servicio.listar().subscribe();

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/escenarios?page=1&tamano=20`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ datos: [], total: 0, pagina: 1, tamano: 20 });
  });

  it('borrar hace DELETE a /escenarios/{id} y completa sin body (204)', () => {
    let completado = false;
    servicio.borrar('abc-123').subscribe({
      next: () => {
        completado = true;
      },
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/escenarios/abc-123`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    expect(completado).toBe(true);
  });

  it('obtenerPorId hace GET a /escenarios/{id} y devuelve el escenario', () => {
    const detalle: EscenarioResponse = {
      id: 'esc-1',
      tipo: 'pricing',
      inputs: { prima: 1000 },
      outputs: { resultado: 1234.5 },
      creadoEn: '2026-09-03T12:00:00.000Z',
    };
    let recibido: EscenarioResponse | undefined;
    servicio.obtenerPorId('esc-1').subscribe((res) => {
      recibido = res;
    });

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/escenarios/esc-1`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(detalle);
    expect(recibido).toEqual(detalle);
  });
});

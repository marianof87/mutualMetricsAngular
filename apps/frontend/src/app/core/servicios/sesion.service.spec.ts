import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import type { SesionResponse } from '@mutual-metrics/shared';
import { SesionService } from './sesion.service';
import { entorno } from '../configuracion/entorno';

const sesionFalsa: SesionResponse = {
  accessToken: 'token.jwt',
  usuario: { id: 'u1', email: 'ana@example.com', nombre: 'Ana' },
};

describe('SesionService', () => {
  let servicio: SesionService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(SesionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('arranca sin usuario autenticado', () => {
    expect(servicio.autenticado()).toBe(false);
    expect(servicio.obtenerToken()).toBeNull();
  });

  it('iniciarSesion guarda token y usuario', () => {
    servicio
      .iniciarSesion({ email: 'ana@example.com', password: 'unaClaveSegura' })
      .subscribe();

    const req = http.expectOne(`${entorno.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(sesionFalsa);

    expect(servicio.obtenerToken()).toBe('token.jwt');
    expect(servicio.usuarioActual()?.nombre).toBe('Ana');
    expect(servicio.autenticado()).toBe(true);
  });

  it('persiste la sesión en localStorage', () => {
    servicio.registrar({ email: 'ana@example.com', password: 'unaClaveSegura', nombre: 'Ana' }).subscribe();
    http.expectOne(`${entorno.apiBaseUrl}/auth/registrar`).flush(sesionFalsa);

    expect(localStorage.getItem('mm_sesion')).toContain('token.jwt');
  });

  it('cerrarSesion limpia estado y storage', () => {
    servicio.iniciarSesion({ email: 'ana@example.com', password: 'x' }).subscribe();
    http.expectOne(`${entorno.apiBaseUrl}/auth/login`).flush(sesionFalsa);

    servicio.cerrarSesion();

    expect(servicio.autenticado()).toBe(false);
    expect(servicio.obtenerToken()).toBeNull();
    expect(localStorage.getItem('mm_sesion')).toBeNull();
  });
});

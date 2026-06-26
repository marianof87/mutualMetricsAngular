import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import type { SesionResponse } from '@mutual-metrics/shared';
import { SesionService } from './sesion.service';
import { entorno } from '../configuracion/entorno';
import { jwtInterceptor } from '../interceptores/jwt.interceptor';
import { erroresInterceptor } from '../interceptores/errores.interceptor';

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

describe('SesionService — revalidación al iniciar', () => {
  function montar() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor, erroresInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    });
    const servicio = TestBed.inject(SesionService);
    const http = TestBed.inject(HttpTestingController);
    return { servicio, http };
  }

  it('verifica el token guardado contra GET /usuarios/yo, con Bearer, y refresca el usuario', () => {
    localStorage.setItem(
      'mm_sesion',
      JSON.stringify({ accessToken: 'token.jwt', usuario: sesionFalsa.usuario }),
    );

    const { servicio, http } = montar();
    servicio.revalidar();

    const req = http.expectOne(`${entorno.apiBaseUrl}/usuarios/yo`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token.jwt');
    req.flush({ id: 'u1', email: 'ana@example.com', nombre: 'Ana Actualizada' });

    expect(servicio.usuarioActual()?.nombre).toBe('Ana Actualizada');
    http.verify();
    localStorage.clear();
  });

  it('limpia la sesión si el backend rechaza el token guardado', () => {
    localStorage.setItem(
      'mm_sesion',
      JSON.stringify({ accessToken: 'token.vencido', usuario: sesionFalsa.usuario }),
    );

    const { servicio, http } = montar();
    servicio.revalidar();

    http
      .expectOne(`${entorno.apiBaseUrl}/usuarios/yo`)
      .flush(
        { error: { code: 'AUTH_TOKEN_EXPIRADO', message: 'Token expirado' } },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(servicio.autenticado()).toBe(false);
    expect(localStorage.getItem('mm_sesion')).toBeNull();
    http.verify();
  });

  it('conserva la sesión ante un error transitorio (500)', () => {
    localStorage.setItem(
      'mm_sesion',
      JSON.stringify({ accessToken: 'token.jwt', usuario: sesionFalsa.usuario }),
    );

    const { servicio, http } = montar();
    servicio.revalidar();

    http
      .expectOne(`${entorno.apiBaseUrl}/usuarios/yo`)
      .flush(
        { error: { code: 'ERROR_INTERNO', message: 'Boom' } },
        { status: 500, statusText: 'Server Error' },
      );

    expect(servicio.autenticado()).toBe(true);
    http.verify();
    localStorage.clear();
  });
});

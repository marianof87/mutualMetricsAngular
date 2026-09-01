import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CodigoError, type EnvelopeError } from '@mutual-metrics/shared';
import { erroresInterceptor } from './errores.interceptor';
import { SesionService } from '../servicios/sesion.service';
import { OMITIR_REDIRECCION_SESION } from './contexto-http';

function configurar() {
  const cerrarSesion = vi.fn();
  const navigate = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([erroresInterceptor])),
      provideHttpClientTesting(),
      { provide: SesionService, useValue: { cerrarSesion } },
      { provide: Router, useValue: { navigate } },
    ],
  });
  return { cerrarSesion, navigate };
}

describe('erroresInterceptor', () => {
  it('cierra la sesión y redirige a /login cuando el token expiró', async () => {
    const { cerrarSesion, navigate } = configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.get('/protegido').subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/protegido').flush(
      { error: { code: CodigoError.AUTH_TOKEN_EXPIRADO, message: 'Token expirado' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    await recibido;
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login']);
    ctrl.verify();
  });

  it('NO cierra la sesión ante credenciales inválidas (login fallido)', async () => {
    const { cerrarSesion, navigate } = configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.post('/auth/login', {}).subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/auth/login').flush(
      { error: { code: CodigoError.AUTH_CREDENCIALES_INVALIDAS, message: 'Credenciales inválidas' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.AUTH_CREDENCIALES_INVALIDAS);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    ctrl.verify();
  });

  it('normaliza una caída de red (status 0) a SERVICIO_NO_DISPONIBLE', async () => {
    configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.get('/algo').subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/algo').error(new ProgressEvent('error'), { status: 0, statusText: '' });

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.SERVICIO_NO_DISPONIBLE);
    ctrl.verify();
  });
});

describe('erroresInterceptor con OMITIR_REDIRECCION_SESION', () => {
  it('NO cierra sesión ni redirige cuando OMITIR_REDIRECCION_SESION=true aunque el código sea AUTH_TOKEN_EXPIRADO', async () => {
    const { cerrarSesion, navigate } = configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http
        .get('/protegido', {
          context: new HttpContext().set(OMITIR_REDIRECCION_SESION, true),
        })
        .subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/protegido').flush(
      { error: { code: CodigoError.AUTH_TOKEN_EXPIRADO, message: 'Token expirado' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.AUTH_TOKEN_EXPIRADO);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    ctrl.verify();
  });

  it('no redirige a /login durante la revalidación silenciosa (simula sesion.service.revalidar())', async () => {
    const { cerrarSesion, navigate } = configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http
        .get('/usuarios/yo', {
          context: new HttpContext().set(OMITIR_REDIRECCION_SESION, true),
        })
        .subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/usuarios/yo').flush(
      { error: { code: CodigoError.AUTH_TOKEN_EXPIRADO, message: 'Token expirado en revalidación' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.AUTH_TOKEN_EXPIRADO);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    ctrl.verify();
  });
});

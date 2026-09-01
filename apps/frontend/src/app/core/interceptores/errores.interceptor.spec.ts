import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpContext,
  HttpHandlerFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CodigoError, type EnvelopeError } from '@mutual-metrics/shared';
import { throwError } from 'rxjs';
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
  it('cierra la sesion y redirige a /login cuando el token expiro', async () => {
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

  it('NO cierra la sesion ante credenciales invalidas (login fallido)', async () => {
    const { cerrarSesion, navigate } = configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.post('/auth/login', {}).subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/auth/login').flush(
      { error: { code: CodigoError.AUTH_CREDENCIALES_INVALIDAS, message: 'Credenciales invalidas' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.AUTH_CREDENCIALES_INVALIDAS);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    ctrl.verify();
  });

  it('normaliza una caida de red (status 0) a SERVICIO_NO_DISPONIBLE', async () => {
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
  it('NO cierra sesion ni redirige cuando OMITIR_REDIRECCION_SESION=true aunque el codigo sea AUTH_TOKEN_EXPIRADO', async () => {
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

  it('no redirige a /login durante la revalidacion silenciosa (simula sesion.service.revalidar())', async () => {
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
      { error: { code: CodigoError.AUTH_TOKEN_EXPIRADO, message: 'Token expirado en revalidacion' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.AUTH_TOKEN_EXPIRADO);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    ctrl.verify();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AMPLIACION RED — brechas MEDIA de la auditoria
// ─────────────────────────────────────────────────────────────────────────────

describe('erroresInterceptor — cobertura AUTH_TOKEN_INVALIDO (RED)', () => {
  it('cierra la sesion y redirige a /login cuando el token es invalido (AUTH_TOKEN_INVALIDO) sin omitir-redireccion', async () => {
    const { cerrarSesion, navigate } = configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.get('/protegido').subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/protegido').flush(
      { error: { code: CodigoError.AUTH_TOKEN_INVALIDO, message: 'Token invalido' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.AUTH_TOKEN_INVALIDO);
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login']);
    ctrl.verify();
  });

  it('NO cierra sesion ni redirige cuando OMITIR_REDIRECCION_SESION=true y code es AUTH_TOKEN_INVALIDO', async () => {
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
      { error: { code: CodigoError.AUTH_TOKEN_INVALIDO, message: 'Token invalido' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.AUTH_TOKEN_INVALIDO);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    ctrl.verify();
  });
});

describe('erroresInterceptor — normalizacion aEnvelope() (RED)', () => {
  it('normaliza 401 con body NO-envelope (sin error.code) a ERROR_INTERNO', async () => {
    configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.get('/algo').subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    // Body sin forma envelope: { mensaje: ''x'' } sin error.code
    ctrl.expectOne('/algo').flush(
      { mensaje: 'x' } as unknown as object,
      { status: 401, statusText: 'Unauthorized' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.ERROR_INTERNO);
    ctrl.verify();
  });

  it('normaliza 500 con body NO-envelope a ERROR_INTERNO', async () => {
    configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.get('/algo').subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/algo').flush(
      { mensaje: 'x' } as unknown as object,
      { status: 500, statusText: 'Server Error' },
    );

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.ERROR_INTERNO);
    ctrl.verify();
  });

  it('normaliza un error que NO es HttpErrorResponse (Error generico) a ERROR_INTERNO', async () => {
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

    const envelope = await TestBed.runInInjectionContext(() => {
      const req = new HttpRequest('GET', '/test');
      const next: HttpHandlerFn = () => throwError(() => new Error('boom'));
      return new Promise<EnvelopeError>((resolve) => {
        erroresInterceptor(req, next).subscribe({ error: (e: EnvelopeError) => resolve(e) });
      });
    });

    expect(envelope.error.code).toBe(CodigoError.ERROR_INTERNO);
    expect(envelope.error.message).toBe('Ocurrió un error inesperado en el cliente');
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('normaliza body null/undefined a ERROR_INTERNO', async () => {
    configurar();
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const recibido = new Promise<EnvelopeError>((resolve) => {
      http.get('/algo').subscribe({ error: (e: EnvelopeError) => resolve(e) });
    });

    ctrl.expectOne('/algo').flush(null as unknown as object, { status: 500, statusText: 'Server Error' });

    const envelope = await recibido;
    expect(envelope.error.code).toBe(CodigoError.ERROR_INTERNO);
    ctrl.verify();
  });
});

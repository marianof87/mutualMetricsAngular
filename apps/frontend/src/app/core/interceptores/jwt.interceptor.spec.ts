import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { SesionService } from '../servicios/sesion.service';

function configurar(token: string | null) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([jwtInterceptor])),
      provideHttpClientTesting(),
      { provide: SesionService, useValue: { obtenerToken: () => token } },
    ],
  });
}

describe('jwtInterceptor', () => {
  it('agrega el header Authorization cuando hay token', () => {
    configurar('token.jwt');
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/algo').subscribe();
    const req = ctrl.expectOne('/algo');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token.jwt');
    req.flush({});
    ctrl.verify();
  });

  it('no agrega header cuando no hay token', () => {
    configurar(null);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/algo').subscribe();
    const req = ctrl.expectOne('/algo');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    ctrl.verify();
  });
});

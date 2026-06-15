import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { LoginRequest, SesionResponse } from '@mutual-metrics/shared';
import { LoginComponent } from './login.component';
import { SesionService } from '../../../core/servicios/sesion.service';

const sesionFalsa: SesionResponse = {
  accessToken: 't',
  usuario: { id: 'u1', email: 'ana@example.com', nombre: 'Ana' },
};

describe('LoginComponent', () => {
  let llamadas: LoginRequest[];

  beforeEach(async () => {
    llamadas = [];
    const sesion = {
      iniciarSesion: (dto: LoginRequest) => {
        llamadas.push(dto);
        return of(sesionFalsa);
      },
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: SesionService, useValue: sesion }],
    }).compileComponents();
  });

  it('no llama al servicio si el formulario es inválido', () => {
    const comp = TestBed.createComponent(LoginComponent).componentInstance;
    comp.enviar();
    expect(llamadas.length).toBe(0);
    expect(comp.mensajeError()).not.toBeNull();
  });

  it('llama al servicio con datos válidos', () => {
    const comp = TestBed.createComponent(LoginComponent).componentInstance;
    comp.formulario.setValue({ email: 'ana@example.com', password: 'unaClaveSegura' });
    comp.enviar();
    expect(llamadas).toEqual([{ email: 'ana@example.com', password: 'unaClaveSegura' }]);
  });
});

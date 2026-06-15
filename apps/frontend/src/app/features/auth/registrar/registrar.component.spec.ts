import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { RegistrarRequest, SesionResponse } from '@mutual-metrics/shared';
import { RegistrarComponent } from './registrar.component';
import { SesionService } from '../../../core/servicios/sesion.service';

const sesionFalsa: SesionResponse = {
  accessToken: 't',
  usuario: { id: 'u1', email: 'ana@example.com', nombre: 'Ana' },
};

describe('RegistrarComponent', () => {
  let llamadas: RegistrarRequest[];

  beforeEach(async () => {
    llamadas = [];
    const sesion = {
      registrar: (dto: RegistrarRequest) => {
        llamadas.push(dto);
        return of(sesionFalsa);
      },
    };

    await TestBed.configureTestingModule({
      imports: [RegistrarComponent],
      providers: [provideRouter([]), { provide: SesionService, useValue: sesion }],
    }).compileComponents();
  });

  it('no llama al servicio si el formulario es inválido', () => {
    const comp = TestBed.createComponent(RegistrarComponent).componentInstance;
    comp.enviar();
    expect(llamadas.length).toBe(0);
    expect(comp.mensajeError()).not.toBeNull();
  });

  it('llama al servicio con datos válidos', () => {
    const comp = TestBed.createComponent(RegistrarComponent).componentInstance;
    comp.formulario.setValue({
      nombre: 'Ana',
      email: 'ana@example.com',
      password: 'unaClaveSegura',
    });
    comp.enviar();
    expect(llamadas).toEqual([
      { nombre: 'Ana', email: 'ana@example.com', password: 'unaClaveSegura' },
    ]);
  });
});

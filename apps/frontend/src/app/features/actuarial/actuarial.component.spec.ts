import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BaseChartDirective } from 'ng2-charts';
import { of, throwError, type Observable } from 'rxjs';
import type { SimulacionActuarialRequest, SimulacionActuarialResponse } from '@mutual-metrics/shared';
import { ActuarialComponent } from './actuarial.component';
import { ActuarialService } from './actuarial.service';

// Stub del gráfico: jsdom no implementa canvas 2D, evitamos romper el test.
@Component({
  selector: 'canvas[baseChart]',
  standalone: true,
  template: '',
})
class CanvasStubDirective {
  @Input() data: unknown = {};
  @Input() options: unknown = {};
  @Input() type = '';
}

const respuestaFalsa: SimulacionActuarialResponse = {
  nSimulaciones: 1000,
  semilla: 42,
  muestrasInvalidas: 3,
  nivelConfianza: 0.95,
  precioOptimo: {
    media: 30,
    mediana: 30,
    desvio: 0.5,
    percentiles: { '5': 29.1, '50': 30, '95': 30.9 },
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
  pisoSolvencia: null,
  probabilidadPerdida: { enPrecioOptimo: 0.05, enPrecioActual: 0.15 },
  curvaRiesgo: [
    { precio: 10, probabilidadPerdida: 0 },
    { precio: 100, probabilidadPerdida: 1 },
  ],
  advertencias: ['Intervalo amplio: mejorá la estimación de A.'],
};

describe('ActuarialComponent', () => {
  let solicitudes: SimulacionActuarialRequest[];
  let servicioMock: {
    simular: (solicitud: SimulacionActuarialRequest) => Observable<SimulacionActuarialResponse | never>;
  };

  beforeEach(async () => {
    solicitudes = [];
    servicioMock = {
      simular: (solicitud: SimulacionActuarialRequest) => {
        solicitudes.push(solicitud);
        return of(respuestaFalsa);
      },
    };

    await TestBed.configureTestingModule({
      imports: [ActuarialComponent],
      providers: [{ provide: ActuarialService, useValue: servicioMock }],
    })
      .overrideComponent(ActuarialComponent, {
        remove: { imports: [BaseChartDirective] },
        add: { imports: [CanvasStubDirective] },
      })
      .compileComponents();
  });

  it('crea el componente con los valores por defecto y el panel de espera', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Módulo Actuarial');
    expect(el.textContent).toContain('Esperando simulación');
    expect(el.querySelector('button.btn-simular')).not.toBeNull();
  });

  it('deshabilita el botón y avisa cuando A y C son fijos (sin incertidumbre)', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.modoA.set('fijo');
    comp.modoC.set('fijo');
    fixture.detectChanges();

    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.btn-simular',
    ) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Al menos un coeficiente debe ser estocástico',
    );
  });

  it('no llama al servicio si no hay incertidumbre', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.modoA.set('fijo');
    comp.modoC.set('fijo');
    comp.simular();

    expect(solicitudes.length).toBe(0);
  });

  it('envía el request construido con las señales y renderiza métricas, percentiles y advertencias', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.semilla.set(42);
    comp.simular();
    fixture.detectChanges();

    expect(solicitudes.length).toBe(1);
    const solicitud = solicitudes[0];
    expect(solicitud.coeficienteA).toEqual({ tipo: 'triangular', minimo: -3, moda: -2, maximo: -1 });
    expect(solicitud.coeficienteC).toEqual({
      tipo: 'normal',
      minimo: -1100,
      maximo: -900,
      nivelConfianza: 0.9,
    });
    expect(solicitud.semilla).toBe(42);
    expect(solicitud.precioActual).toBeUndefined();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('$ 30.00');
    expect(el.textContent).toContain('Intervalo: $ 29.05 – $ 30.95');
    expect(el.textContent).toContain('Sin piso solvente');
    expect(el.textContent).toContain('P5');
    expect(el.textContent).toContain('Advertencias (causa → acción)');
    expect(el.textContent).toContain('Intervalo amplio');
    expect(el.textContent).toContain('semilla 42');
    expect(el.textContent).toContain('3 descartadas');
    expect(comp.resultado()).not.toBeNull();
  });

  it('muestra el mensaje del envelope de error sin crashear', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.modoC.set('fijo');
    comp.aValor.set(-2);
    servicioMock.simular = () =>
      throwError(() => ({ error: { message: 'Al menos un coeficiente estocástico.' } }));
    comp.simular();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Al menos un coeficiente estocástico.');
    expect(comp.cargando()).toBe(false);
  });

  it('mapea los percentiles del precio óptimo con su clave', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    const percentiles = comp.percentilesDe(respuestaFalsa);

    expect(percentiles).toEqual([
      { clave: '5', valor: 29.1 },
      { clave: '50', valor: 30 },
      { clave: '95', valor: 30.9 },
    ]);
  });
});
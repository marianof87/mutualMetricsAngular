import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { BaseChartDirective } from 'ng2-charts';
import { vi } from 'vitest';
import type { SimulacionActuarialResponse } from '@mutual-metrics/shared';
import { ActuarialComponent } from './actuarial.component';
import { ActuarialService } from './actuarial.service';
import { entorno } from '../../core/configuracion/entorno';

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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActuarialComponent],
      providers: [ActuarialService],
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

  it('deshabilita el botón y avisa cuando A, B y C son fijos (sin incertidumbre)', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.modoA.set('fijo');
    comp.modoB.set('fijo');
    comp.modoC.set('fijo');
    fixture.detectChanges();

    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.btn-simular',
    ) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'al menos un dato tiene que tener variación',
    );
  });

  it('no ejecuta la simulación si no hay incertidumbre', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.modoA.set('fijo');
    comp.modoB.set('fijo');
    comp.modoC.set('fijo');
    comp.simular();

    expect(comp.resultado()).toBeNull();
    expect(comp.cargando()).toBe(false);
  });

  it('ejecuta la simulación localmente sin llamar al backend', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.semilla.set(42);
    comp.simular();

    expect(comp.cargando()).toBe(true);
    expect(comp.error()).toBeNull();
  });

  it('captura errores del dominio sin crashear', () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.modoA.set('fijo');
    comp.modoB.set('fijo');
    comp.modoC.set('fijo');
    comp.aValor.set(5);
    comp.bValor.set(120);
    comp.cValor.set(-1000);

    comp.simular();

    expect(comp.resultado()).toBeNull();
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

describe('ActuarialComponent — ejecución asíncrona con fake timers', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await TestBed.configureTestingModule({
      imports: [ActuarialComponent],
      providers: [ActuarialService, provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(ActuarialComponent, {
        remove: { imports: [BaseChartDirective] },
        add: { imports: [CanvasStubDirective] },
      })
      .compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('resuelve la simulación y popula resultado + cargando vuelve a false', async () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.semilla.set(42);
    comp.nSimulaciones.set(100);

    comp.simular();
    expect(comp.cargando()).toBe(true);

    // Flush todos los timers (componente + chunking interno de simularRiesgoAsync)
    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(0);
    }
    fixture.detectChanges();

    expect(comp.cargando()).toBe(false);
    expect(comp.error()).toBeNull();
    expect(comp.resultado()).not.toBeNull();
    expect(comp.resultado()!.nSimulaciones).toBe(100);
  });

  it('maneja escenarios degenerados sin crashear (A >= 0)', async () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.semilla.set(42);
    comp.nSimulaciones.set(100);
    comp.aValor.set(10);
    comp.aMinimo.set(10);
    comp.aMaximo.set(10);

    comp.simular();
    expect(comp.cargando()).toBe(true);

    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(0);
    }
    fixture.detectChanges();

    expect(comp.cargando()).toBe(false);
    expect(comp.error()).toBeNull();
    expect(comp.resultado()).not.toBeNull();
    expect(comp.resultado()!.muestrasInvalidas).toBe(100);
  });

  it('guardarResultado hace POST al endpoint de guardar con el payload del resumen', async () => {
    const fixture = TestBed.createComponent(ActuarialComponent);
    const comp = fixture.componentInstance;
    comp.semilla.set(42);
    comp.nSimulaciones.set(100);

    comp.simular();

    for (let i = 0; i < 20; i++) {
      await vi.advanceTimersByTimeAsync(0);
    }
    fixture.detectChanges();

    expect(comp.resultado()).not.toBeNull();
    expect(comp.guardado()).toBe('pendiente');

    comp.guardarResultado();
    expect(comp.guardado()).toBe('guardando');

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/actuarial/simulaciones/guardar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body.coeficienteBTipo).toBe('fijo');
    expect(peticion.request.body.nSimulaciones).toBe(100);
    peticion.flush({ id: 'uuid-test' });

    expect(comp.guardado()).toBe('ok');
  });
});

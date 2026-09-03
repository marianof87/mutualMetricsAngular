import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject, throwError } from 'rxjs';
import { ModalDetalleEscenarioComponent } from './modal-detalle-escenario.component';
import { HistorialService } from '../historial.service';
import type { EnvelopeError, EscenarioResponse } from '@mutual-metrics/shared';

const detalleBase: EscenarioResponse = {
  id: 'esc-detalle-1',
  tipo: 'cuadratica',
  inputs: { a: 1, b: { c: 2 } },
  outputs: { x1: 3 },
  creadoEn: '2026-09-03T12:00:00.000Z',
};

const envelope = (code: string, message?: string): EnvelopeError =>
  ({ error: { code, message } }) as EnvelopeError;

describe('ModalDetalleEscenarioComponent', () => {
  let mockObtenerPorId: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockObtenerPorId = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ModalDetalleEscenarioComponent],
      providers: [
        { provide: HistorialService, useValue: { obtenerPorId: mockObtenerPorId } },
      ],
    }).compileComponents();
  });

  function crearComponente(id = 'esc-detalle-1') {
    const fixture = TestBed.createComponent(ModalDetalleEscenarioComponent);
    fixture.componentRef.setInput('escenarioId', id);
    const emisor = vi.fn();
    fixture.componentInstance.cerrado.subscribe(emisor);
    return { fixture, cmp: fixture.componentInstance, emisor };
  }

  it('muestra "Cargando detalle…" con role=status antes de resolver', () => {
    const sujeto = new Subject<EscenarioResponse>();
    mockObtenerPorId.mockReturnValue(sujeto);

    const { fixture } = crearComponente();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const estado = el.querySelector('.estado[role="status"]');
    expect(estado?.textContent).toContain('Cargando detalle…');
    expect(mockObtenerPorId).toHaveBeenCalledWith('esc-detalle-1');

    sujeto.complete();
  });

  it('éxito: renderiza tipo, fecha, dt de inputs/outputs y pre con JSON', () => {
    const sujeto = new Subject<EscenarioResponse>();
    mockObtenerPorId.mockReturnValue(sujeto);

    const { fixture } = crearComponente();
    fixture.detectChanges();

    sujeto.next(detalleBase);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;

    // Tipo y fecha en la meta.
    expect(el.querySelector('.detalle-meta dd')?.textContent).toContain('Cuadrática');
    const fecha = el.querySelector('.detalle-meta time');
    expect(fecha?.getAttribute('datetime')).toBe(detalleBase.creadoEn);
    expect(fecha?.textContent).toBeTruthy();

    // Secciones de inputs y outputs.
    const secciones = el.querySelectorAll('.detalle-seccion');
    expect(secciones.length).toBe(2);

    // dt de inputs (a, b) y de outputs (x1).
    const dts = Array.from(el.querySelectorAll('.detalle-clave-valor dt')).map((n) =>
      n.textContent?.trim(),
    );
    expect(dts).toContain('a');
    expect(dts).toContain('b');
    expect(dts).toContain('x1');

    // pre con JSON: el objeto b se serializa indentado, el número 1 tal cual.
    const pres = Array.from(el.querySelectorAll('.detalle-json')).map((n) =>
      n.textContent?.trim(),
    );
    expect(pres).toContain('1');
    expect(pres).toContain(JSON.stringify({ c: 2 }, null, 2));
    expect(pres).toContain('3');
  });

  it('inputs/outputs vacíos muestran "Sin datos"', () => {
    const sujeto = new Subject<EscenarioResponse>();
    mockObtenerPorId.mockReturnValue(sujeto);

    const { fixture } = crearComponente();
    fixture.detectChanges();

    sujeto.next({
      ...detalleBase,
      inputs: {},
      outputs: {},
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const sinDatos = el.querySelectorAll('.detalle-sin-datos');
    expect(sinDatos.length).toBe(2);
    expect(sinDatos[0].textContent).toContain('Sin datos');
    expect(el.querySelector('.detalle-clave-valor')).toBeNull();
  });

  it('404 ESCENARIOS_NO_ENCONTRADO muestra el mensaje del backend en role=alert', () => {
    mockObtenerPorId.mockReturnValue(
      throwError(() => envelope('ESCENARIOS_NO_ENCONTRADO', 'El escenario no existe')),
    );

    const { fixture, cmp } = crearComponente();
    fixture.detectChanges();

    expect(cmp.error()).toBe('El escenario no existe');
    const alerta = fixture.nativeElement.querySelector('.estado.error[role="alert"]');
    expect(alerta).not.toBeNull();
    expect(alerta.textContent).toContain('El escenario no existe');
  });

  it('error genérico muestra el message del envelope', () => {
    mockObtenerPorId.mockReturnValue(throwError(() => envelope('ERROR_INTERNO', 'El servidor falló')));

    const { fixture, cmp } = crearComponente();
    fixture.detectChanges();

    expect(cmp.error()).toBe('El servidor falló');
    const alerta = fixture.nativeElement.querySelector('.estado.error[role="alert"]');
    expect(alerta?.textContent).toContain('El servidor falló');
  });

  it('error sin message usa fallback "No se pudo cargar el escenario."', () => {
    mockObtenerPorId.mockReturnValue(throwError(() => envelope('ERROR_INTERNO')));

    const { fixture, cmp } = crearComponente();
    fixture.detectChanges();

    expect(cmp.error()).toBe('No se pudo cargar el escenario.');
  });

  it('token rechazado deja error() null y sin role=alert', () => {
    mockObtenerPorId.mockReturnValue(
      throwError(() => envelope('AUTH_TOKEN_EXPIRADO', 'Sesión expirada')),
    );

    const { fixture, cmp } = crearComponente();
    fixture.detectChanges();

    expect(cmp.error()).toBeNull();
    expect(fixture.nativeElement.querySelector('.estado.error[role="alert"]')).toBeNull();
    expect(cmp.estaCargando()).toBe(false);
  });

  it('click en .modal-cerrar emite cerrado', () => {
    const sujeto = new Subject<EscenarioResponse>();
    mockObtenerPorId.mockReturnValue(sujeto);

    const { fixture, emisor } = crearComponente();
    fixture.detectChanges();
    sujeto.next(detalleBase);
    fixture.detectChanges();

    const cerrar = fixture.nativeElement.querySelector('.modal-cerrar');
    cerrar.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(emisor).toHaveBeenCalledTimes(1);
  });

  it('click en el overlay emite cerrado y el clic interior no se propaga', () => {
    const sujeto = new Subject<EscenarioResponse>();
    mockObtenerPorId.mockReturnValue(sujeto);

    const { fixture, emisor } = crearComponente();
    fixture.detectChanges();
    sujeto.next(detalleBase);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement;
    overlay.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(emisor).toHaveBeenCalledTimes(1);
  });
});

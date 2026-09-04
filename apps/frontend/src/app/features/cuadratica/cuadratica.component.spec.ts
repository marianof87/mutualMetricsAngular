import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { CuadraticaComponent } from './cuadratica.component';
import { CuadraticaService } from './cuadratica.service';
import type { CuadraticaResponse, EnvelopeError } from '@mutual-metrics/shared';
import { CodigoError } from '@mutual-metrics/shared';

// Stub para ng2-charts (igual que el spec actual)
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

const respuestaDosReales: CuadraticaResponse = {
  discriminante: 1,
  tipo: 'dosReales',
  raices: [3, 2],
  vertice: { x: 2.5, y: -0.25 },
};

const respuestaUnaDoble: CuadraticaResponse = {
  discriminante: 0,
  tipo: 'unaRealDoble',
  raices: [2, 2],
  vertice: { x: 2, y: 0 },
};

const respuestaSinReales: CuadraticaResponse = {
  discriminante: -20,
  tipo: 'sinRaicesReales',
  raices: null,
  vertice: { x: 0, y: 5 },
};

describe('CuadraticaComponent', () => {
  let mockResolver: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockResolver = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CuadraticaComponent],
      providers: [{ provide: CuadraticaService, useValue: { resolver: mockResolver } }],
    })
      .overrideComponent(CuadraticaComponent, {
        remove: { imports: [BaseChartDirective] },
        add: { imports: [CanvasStubDirective] },
      })
      .compileComponents();

    history.replaceState({}, '');
  });

  afterEach(() => {
    history.replaceState({}, '');
    vi.clearAllMocks();
  });

  // ── Render y formulario ──────────────────────────────────────────────
  it('renderiza título, inputs coeff-a/b/c y botón Resolver', () => {
    const fixture = TestBed.createComponent(CuadraticaComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.solver-title')?.textContent).toContain('Calculadora Cuadrática');
    expect(el.querySelector('#coeff-a')).not.toBeNull();
    expect(el.querySelector('#coeff-b')).not.toBeNull();
    expect(el.querySelector('#coeff-c')).not.toBeNull();
    expect(el.querySelector('button[type="submit"]')?.textContent).toContain('Resolver');
    expect(el.querySelector('canvas[baseChart]') ?? el.querySelector('canvas')).not.toBeNull();
  });

  it('formulario inicial con valores por defecto (1, -4, 4) y signals en estado inicial', () => {
    const { componentInstance: cmp } = TestBed.createComponent(CuadraticaComponent);

    expect(cmp.formulario).toBeTruthy();
    expect(cmp.formulario.getRawValue()).toEqual({ a: 1, b: -4, c: 4 });
    expect(cmp.formulario.valid).toBe(true);
    expect(cmp.enviando()).toBe(false);
    expect(cmp.resultado()).toBeNull();
    expect(cmp.mensajeError()).toBeNull();
  });

  it('panel de resultados oculto cuando resultado() es null', () => {
    mockResolver.mockReturnValue(of(respuestaDosReales));
    const fixture = TestBed.createComponent(CuadraticaComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.results-section')).toBeNull();
  });

  // ── Envío válido ─────────────────────────────────────────────────────
  it('submit válido llama a resolver() UNA vez con el dto del formulario, setea resultado y enviando vuelve a false', () => {
    mockResolver.mockReturnValue(of(respuestaDosReales));
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;

    cmp.formulario.patchValue({ a: 1, b: -5, c: 6 });
    expect(cmp.formulario.valid).toBe(true);

    cmp.resolver();

    expect(mockResolver).toHaveBeenCalledTimes(1);
    expect(mockResolver).toHaveBeenCalledWith({ a: 1, b: -5, c: 6 });
    expect(cmp.resultado()).toEqual(respuestaDosReales);
    expect(cmp.enviando()).toBe(false);
    expect(cmp.mensajeError()).toBeNull();
  });

  it('éxito muestra en el DOM: discriminante, tipo en español, raíces y vértice', () => {
    mockResolver.mockReturnValue(of(respuestaDosReales));
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 1, b: -5, c: 6 });
    cmp.resolver();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const texto = el.textContent ?? '';
    expect(texto).toContain('1,00'); // discriminante 1 formateado en es-AR
    expect(texto).toContain('Dos raíces reales');
    expect(texto).toContain('3');
    expect(texto).toContain('2');
    expect(texto).toContain('2,50');
    expect(el.querySelector('.results-section')).not.toBeNull();
  });

  it('mapea tipo unaRealDoble → "Una raíz real doble" y sinRaicesReales → "Sin raíces reales"', () => {
    mockResolver.mockReturnValue(of(respuestaUnaDoble));
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 1, b: -4, c: 4 });
    cmp.resolver();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Una raíz real doble');

    mockResolver.mockReturnValue(of(respuestaSinReales));
    cmp.formulario.patchValue({ a: 1, b: 0, c: 5 });
    cmp.resolver();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin raíces reales');
  });

  it('enviando true deshabilita el botón Resolver', () => {
    const subject = new Subject<CuadraticaResponse>();
    mockResolver.mockReturnValue(subject.asObservable());

    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 1, b: -5, c: 6 });
    cmp.resolver();
    fixture.detectChanges();

    expect(cmp.enviando()).toBe(true);
    const btn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    subject.next(respuestaDosReales);
    subject.complete();
    fixture.detectChanges();
    expect(cmp.enviando()).toBe(false);
    expect(
      (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  // ── Validación local (no llama al service) ───────────────────────────
  it('a=0 (form inválido) NO llama al service, marca touched y setea mensajeError local', () => {
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 0, b: -4, c: 4 });

    cmp.resolver();

    expect(mockResolver).not.toHaveBeenCalled();
    expect(cmp.formulario.touched).toBe(true);
    expect(cmp.mensajeError()).toBeTruthy();
    expect((cmp.mensajeError() as string).toLowerCase()).toMatch(/a|revisá|válido|cero/);
  });

  it('valor no finito (NaN/Infinity) es inválido y no llama al service', () => {
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({
      a: NaN,
      b: 1,
      c: 1,
    } as unknown as { a: number; b: number; c: number });
    cmp.resolver();
    expect(mockResolver).not.toHaveBeenCalled();
    expect(cmp.mensajeError()).toBeTruthy();
  });

  // ── Errores del servidor (EnvelopeError normalizado por interceptor) ──
  it('error del server con envelope CUADRATICA_A_CERO muestra envelope.error.message y role=alert', () => {
    const envelope: EnvelopeError = {
      error: { code: CodigoError.CUADRATICA_A_CERO, message: "El coeficiente 'a' no puede ser cero" },
    };
    mockResolver.mockReturnValue(throwError(() => envelope));

    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 1, b: -5, c: 6 });
    cmp.resolver();
    fixture.detectChanges();

    expect(cmp.enviando()).toBe(false);
    expect(cmp.mensajeError()).toBe("El coeficiente 'a' no puede ser cero");
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      "El coeficiente 'a' no puede ser cero",
    );
  });

  it('error sin message usa fallback "No se pudo resolver la ecuación"', () => {
    mockResolver.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 1, b: -5, c: 6 });

    cmp.resolver();
    expect(cmp.mensajeError()).toBe('No se pudo resolver la ecuación');

    mockResolver.mockReturnValue(throwError(() => ({ error: {} })));
    cmp.resolver();
    expect(cmp.mensajeError()).toBe('No se pudo resolver la ecuación');
  });

  it('error con env.error undefined usa el mismo fallback', () => {
    mockResolver.mockReturnValue(throwError(() => ({ error: undefined })));
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 1, b: -5, c: 6 });
    cmp.resolver();
    expect(cmp.mensajeError()).toBe('No se pudo resolver la ecuación');
  });

it('error SERVICIO_NO_DISPONIBLE (caída de red) muestra "No se pudo contactar al servidor"', () => {
    const envelope: EnvelopeError = {
      error: { code: CodigoError.SERVICIO_NO_DISPONIBLE, message: 'No se pudo contactar al servidor' },
    };
    mockResolver.mockReturnValue(throwError(() => envelope));
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue({ a: 1, b: -5, c: 6 });
    cmp.resolver();
    expect(cmp.mensajeError()).toBe('No se pudo contactar al servidor');
  });

  // ── Gráfico (se mantiene local) ──────────────────────────────────────
  it('mantiene lineChartData/lineChartOptions y renderiza canvas baseChart', () => {
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    expect(cmp.lineChartData).toBeTruthy();
    expect(cmp.lineChartOptions).toBeTruthy();
    // lineChartData es una signal invocable con los puntos de la parábola.
    const data = (cmp.lineChartData as () => unknown)();
    expect(data).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('canvas[baseChart]') ?? fixture.nativeElement.querySelector('canvas'),
    ).not.toBeNull();
  });

  // ── Precarga history.state (D3) ──────────────────────────────────────
  describe('Precarga desde history.state (re-ejecución de escenario)', () => {
    it('con history.state.inputs = { a:2, b:1, c:-6 } precarga el formulario y auto-resuelve', () => {
      const respuesta: CuadraticaResponse = {
        discriminante: 49,
        tipo: 'dosReales',
        raices: [1.5, -2],
        vertice: { x: -0.25, y: -6.125 },
      };
      mockResolver.mockReturnValue(of(respuesta));
      history.replaceState({ inputs: { a: 2, b: 1, c: -6 } }, '');

      const fixture = TestBed.createComponent(CuadraticaComponent);
      fixture.detectChanges();

      const cmp = fixture.componentInstance;
      expect(cmp.formulario.getRawValue()).toEqual({ a: 2, b: 1, c: -6 });
      expect(mockResolver).toHaveBeenCalledTimes(1);
      expect(mockResolver).toHaveBeenCalledWith({ a: 2, b: 1, c: -6 });
      expect(cmp.resultado()).toEqual(respuesta);
    });

    it('con history.state sin inputs mantiene defaults y NO llama al service', () => {
      history.replaceState({}, '');
      mockResolver.mockReturnValue(of(respuestaDosReales));
      const fixture = TestBed.createComponent(CuadraticaComponent);
      fixture.detectChanges();
      const cmp = fixture.componentInstance;

      expect(cmp.formulario.getRawValue()).toEqual({ a: 1, b: -4, c: 4 });
      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('con history.state undefined mantiene defaults y NO llama', () => {
      history.replaceState(null, '');
      mockResolver.mockReturnValue(of(respuestaDosReales));
      const fixture = TestBed.createComponent(CuadraticaComponent);
      fixture.detectChanges();
      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('defensivo: inputs.a no numérico no pisa el default de a', () => {
      history.replaceState({ inputs: { a: 'x', b: 5, c: -3 } }, '');
      mockResolver.mockReturnValue(of(respuestaDosReales));
      const fixture = TestBed.createComponent(CuadraticaComponent);
      fixture.detectChanges();
      const cmp = fixture.componentInstance;

      expect(cmp.formulario.controls.a.value).toBe(1);
      expect(cmp.formulario.controls.b.value).toBe(5);
      expect(cmp.formulario.controls.c.value).toBe(-3);
      expect(mockResolver).toHaveBeenCalledWith({ a: 1, b: 5, c: -3 });
    });

    it('defensivo: inputs parciales (solo b) solo precarga b', () => {
      history.replaceState({ inputs: { b: 7 } }, '');
      mockResolver.mockReturnValue(of(respuestaDosReales));
      const fixture = TestBed.createComponent(CuadraticaComponent);
      fixture.detectChanges();
      const cmp = fixture.componentInstance;

      expect(cmp.formulario.getRawValue()).toEqual({ a: 1, b: 7, c: 4 });
      expect(mockResolver).toHaveBeenCalledWith({ a: 1, b: 7, c: 4 });
    });

    it('defensivo: inputs con Infinity no se precarga (Number.isFinite)', () => {
      history.replaceState({ inputs: { a: Infinity, b: -Infinity, c: 3 } }, '');
      mockResolver.mockReturnValue(of(respuestaDosReales));
      const fixture = TestBed.createComponent(CuadraticaComponent);
      fixture.detectChanges();
      const cmp = fixture.componentInstance;

      expect(cmp.formulario.controls.a.value).toBe(1);
      expect(cmp.formulario.controls.b.value).toBe(-4);
      expect(cmp.formulario.controls.c.value).toBe(3);
      expect(mockResolver).toHaveBeenCalledWith({ a: 1, b: -4, c: 3 });
    });

    it('claves desconocidas se ignoran sin efecto', () => {
      history.replaceState({ inputs: { a: 3, d: 99, extra: 'foo' } }, '');
      mockResolver.mockReturnValue(of(respuestaDosReales));
      const fixture = TestBed.createComponent(CuadraticaComponent);
      fixture.detectChanges();
      const cmp = fixture.componentInstance;

      expect(cmp.formulario.getRawValue()).toEqual({ a: 3, b: -4, c: 4 });
      expect(mockResolver).toHaveBeenCalledWith({ a: 3, b: -4, c: 4 });
    });
  });
});

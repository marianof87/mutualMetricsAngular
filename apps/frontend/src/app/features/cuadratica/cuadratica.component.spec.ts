import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseChartDirective } from 'ng2-charts';
import { CuadraticaComponent } from './cuadratica.component';

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

describe('CuadraticaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuadraticaComponent],
    })
      .overrideComponent(CuadraticaComponent, {
        remove: { imports: [BaseChartDirective] },
        add: { imports: [CanvasStubDirective] },
      })
      .compileComponents();
  });

  it('computeds iniciales con a=1,b=-4,c=4 → discriminant 0, hasRealRoots true, roots {2,null}, vertex {2,0}', () => {
    const { componentInstance: cmp } = TestBed.createComponent(CuadraticaComponent);

    expect(cmp.a()).toBe(1);
    expect(cmp.b()).toBe(-4);
    expect(cmp.c()).toBe(4);
    expect(cmp.discriminant()).toBe(0); // 16 - 16
    expect(cmp.hasRealRoots()).toBe(true);
    expect(cmp.roots()).toEqual({ x1: 2, x2: null });
    expect(cmp.vertex()).toEqual({ x: 2, y: 0 });
  });

  it('roots es null cuando discriminant < 0 (a=1,b=0,c=5 → det=-20)', () => {
    const { componentInstance: cmp } = TestBed.createComponent(CuadraticaComponent);
    cmp.a.set(1);
    cmp.b.set(0);
    cmp.c.set(5);

    expect(cmp.discriminant()).toBe(-20);
    expect(cmp.hasRealRoots()).toBe(false);
    expect(cmp.roots()).toBeNull();
  });

  it('roots es null cuando a===0 aunque discriminant >=0', () => {
    const { componentInstance: cmp } = TestBed.createComponent(CuadraticaComponent);
    cmp.a.set(0);
    cmp.b.set(2);
    cmp.c.set(1);

    expect(cmp.roots()).toBeNull();
  });

  it('vertex es null cuando a===0', () => {
    const { componentInstance: cmp } = TestBed.createComponent(CuadraticaComponent);
    cmp.a.set(0);
    expect(cmp.vertex()).toBeNull();
  });

  it('roots con dos raíces reales (a=1,b=-5,c=6 → det=1 → x1=3, x2=2)', () => {
    const { componentInstance: cmp } = TestBed.createComponent(CuadraticaComponent);
    cmp.a.set(1);
    cmp.b.set(-5);
    cmp.c.set(6);

    expect(cmp.discriminant()).toBe(1);
    expect(cmp.hasRealRoots()).toBe(true);
    expect(cmp.roots()).toEqual({ x1: 3, x2: 2 });
  });

  it('updateChart arma labels/data (41 puntos vx±10 paso 0.5) y respeta early return si a===0', () => {
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;

    // UpdateChart se invoca explícitamente (el effect() solo se dispara con detectChanges).
    cmp.a.set(1);
    cmp.b.set(-4);
    cmp.c.set(4);
    cmp.updateChart();
    const inicial = cmp.lineChartData();
    const labelsIniciales = inicial.labels as string[];
    expect(labelsIniciales.length).toBe(41); // (20 / 0.5) + 1
    expect(inicial.datasets[0].data.length).toBe(41);
    expect(inicial.datasets[0].label).toContain('f(x) = 1x² + -4x + 4');

    // a=0 → no toca lineChartData
    cmp.a.set(0);
    cmp.updateChart();
    const despues = cmp.lineChartData();
    expect(despues.labels as string[]).toEqual(labelsIniciales); // intacto

    // volver a a≠0 regenera con nuevo vértice
    cmp.a.set(1);
    cmp.b.set(-5);
    cmp.c.set(6); // vx = 2.5
    cmp.updateChart();
    const regenerado = cmp.lineChartData();
    const labelsRegenerados = regenerado.labels as string[];
    expect(labelsRegenerados[0]).toBe((2.5 - 10).toFixed(1)); // "-7.5"
    expect(labelsRegenerados.length).toBe(41);
  });

  it('renderiza título y canvas stub sin error', () => {
    const fixture = TestBed.createComponent(CuadraticaComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.solver-title')?.textContent).toContain('Calculadora Cuadrática');
    expect(el.querySelector('canvas[baseChart]') ?? el.querySelector('canvas')).not.toBeNull();
  });

  it('muestra mensaje de error cuando a===0 y oculta resultados', () => {
    const fixture = TestBed.createComponent(CuadraticaComponent);
    const cmp = fixture.componentInstance;
    cmp.a.set(0);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-message')?.textContent).toContain(
      "El coeficiente 'a' no puede ser cero",
    );
    expect(el.querySelector('.results-section')).toBeNull();
  });
});

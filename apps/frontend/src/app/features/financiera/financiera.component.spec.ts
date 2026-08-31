import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FinancieraComponent } from './financiera.component';
import {
  calcularInteresSimple,
  calcularInteresCompuesto,
  calcularROI,
  calcularVAN,
} from '@mutual-metrics/shared';

describe('FinancieraComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancieraComponent],
    }).compileComponents();
  });

  describe('valores por defecto y computeds iniciales', () => {
    it('tipoActivo por defecto es "interes-simple"', () => {
      const { componentInstance } = TestBed.createComponent(FinancieraComponent);
      expect(componentInstance.tipoActivo()).toBe('interes-simple');
    });

    it('isResultado inicial es 50 de interés y 1050 total (1000, 5%, 1 año)', () => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      const cmp = fixture.componentInstance;

      expect(cmp.isPrincipal()).toBe(1000);
      expect(cmp.isTasa()).toBe(5);
      expect(cmp.isTiempo()).toBe(1);
      // el componente hace /100 antes de llamar
      expect(cmp.isResultado()).toEqual(calcularInteresSimple(1000, 0.05, 1));
      expect(cmp.isResultado()).toEqual({ interes: 50, total: 1050 });
    });

    it('icResultado inicial usa frecuencia mensual (12)', () => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      const cmp = fixture.componentInstance;

      expect(cmp.icPrincipal()).toBe(1000);
      expect(cmp.icTasa()).toBe(5);
      expect(cmp.icTiempo()).toBe(1);
      expect(cmp.icFrecuencia()).toBe(12);

      const esperado = calcularInteresCompuesto(1000, 0.05, 1, 12);
      expect(cmp.icResultado().total).toBeCloseTo(esperado.total, 6);
      expect(cmp.icResultado().interes).toBeCloseTo(51.16189788, 4);
      expect(cmp.icResultado().interes).toBeCloseTo(esperado.interes, 6);
    });

    it('roiResultado inicial es 50% (1000 invertido, 1500 beneficio)', () => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      const cmp = fixture.componentInstance;

      expect(cmp.roiInversion()).toBe(1000);
      expect(cmp.roiBeneficio()).toBe(1500);
      expect(cmp.roiResultado()).toBe(50);
      expect(cmp.roiResultado()).toBe(calcularROI(1000, 1500));
    });

    it('vtFlujos, vtVan y vtTir iniciales coherentes con "500, 700, 300"', () => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      const cmp = fixture.componentInstance;

      expect(cmp.vtTasa()).toBe(10);
      expect(cmp.vtInversion()).toBe(-1000);
      expect(cmp.vtFlujosStr()).toBe('500, 700, 300');
      expect(cmp.vtFlujos()).toEqual([500, 700, 300]);

      // VAN ≈ 258.45 con tasa 10%
      expect(cmp.vtVan()).toBeCloseTo(258.452292, 2);
      expect(cmp.vtVan()).toBeCloseTo(calcularVAN(0.1, -1000, [500, 700, 300]), 6);

      // TIR ≈ 25% — el VAN descontado a la TIR debe ser ~0
      expect(cmp.vtTir()).toBeCloseTo(0.25, 1);
      expect(calcularVAN(cmp.vtTir(), -1000, [500, 700, 300])).toBeCloseTo(0, 2);
    });

    it('renderiza título "Calculadora Financiera" y las 4 pestañas', () => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('.financiera-title')?.textContent).toContain(
        'Calculadora Financiera',
      );
      const tabs = el.querySelectorAll('.tabs-navigation button');
      expect(tabs.length).toBe(4);
      expect(el.textContent).toContain('Interés Simple');
      expect(el.textContent).toContain('Interés Compuesto');
      expect(el.textContent).toContain('ROI');
      expect(el.textContent).toContain('VAN & TIR');
    });
  });

  describe('setTipo()', () => {
    it.each([
      'interes-simple',
      'interes-compuesto',
      'roi',
      'van-tir',
    ] as const)('cambia tipoActivo a "%s"', (tipo) => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      const cmp = fixture.componentInstance;

      cmp.setTipo(tipo);
      expect(cmp.tipoActivo()).toBe(tipo);
    });

    it('cambia el DOM activo al seleccionar otra pestaña', () => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      fixture.detectChanges();
      const cmp = fixture.componentInstance;

      cmp.setTipo('roi');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const botonRoi = Array.from(el.querySelectorAll('.tabs-navigation button')).find((b) =>
        b.textContent?.includes('ROI'),
      ) as HTMLButtonElement;
      expect(botonRoi.classList.contains('active')).toBe(true);
      expect(el.textContent).toContain('Análisis de Retorno');
    });
  });

  describe('vtFlujos — parseo de string', () => {
    it('parsea "500, 700, 300" correctamente', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);
      cmp.vtFlujosStr.set('500, 700, 300');
      expect(cmp.vtFlujos()).toEqual([500, 700, 300]);
    });

    it('filtra NaN y espacios: "500, abc, 700, , 300" → [500,700,300]', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);
      cmp.vtFlujosStr.set('500, abc, 700, , 300');
      expect(cmp.vtFlujos()).toEqual([500, 700, 300]);
    });

    it('maneja decimales y negativos', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);
      cmp.vtFlujosStr.set(' -100.5 , 200.75, 0 ');
      expect(cmp.vtFlujos()).toEqual([-100.5, 200.75, 0]);
    });

    it('string vacío o solo comas devuelve array vacío', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);
      cmp.vtFlujosStr.set('');
      expect(cmp.vtFlujos()).toEqual([]);
      cmp.vtFlujosStr.set(' , , ');
      expect(cmp.vtFlujos()).toEqual([]);
    });

    it('filtra "NaN" literal y valores no numéricos', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);
      cmp.vtFlujosStr.set('NaN, 100, foo');
      expect(cmp.vtFlujos()).toEqual([100]);
    });
  });

  describe('computeds reactivos al cambiar signals', () => {
    it('isResultado reacciona a cambios de isPrincipal/isTasa/isTiempo', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);

      cmp.isPrincipal.set(2000);
      cmp.isTasa.set(10); // 10% → 0.10
      cmp.isTiempo.set(2);
      expect(cmp.isResultado()).toEqual(calcularInteresSimple(2000, 0.1, 2));
      expect(cmp.isResultado()).toEqual({ interes: 400, total: 2400 });
    });

    it('icResultado reacciona a cambio de frecuencia', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);

      const mensual = cmp.icResultado().total;
      cmp.icFrecuencia.set(1); // anual
      const anual = cmp.icResultado().total;
      expect(mensual).toBeGreaterThan(anual);
      expect(cmp.icResultado()).toEqual(calcularInteresCompuesto(1000, 0.05, 1, 1));
    });

    it('roiResultado negativo ante pérdida', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);
      cmp.roiBeneficio.set(800); // inversión 1000, beneficio 800 → -20%
      expect(cmp.roiResultado()).toBe(-20);
    });

    it('vtVan y vtTir reaccionan a nuevo flujo y nueva tasa', () => {
      const fixture = TestBed.createComponent(FinancieraComponent);
      const cmp = fixture.componentInstance;

      cmp.vtFlujosStr.set('1100');
      cmp.vtTasa.set(10);
      // -1000 + 1100/1.1 = 0
      expect(cmp.vtVan()).toBeCloseTo(0, 6);
      // TIR de un solo flujo 1100 con -1000 → 10%
      expect(cmp.vtTir()).toBeCloseTo(0.1, 3);
      expect(calcularVAN(cmp.vtTir(), -1000, [1100])).toBeCloseTo(0, 3);
    });

    it('vtVan con flujos vacíos devuelve la inversión inicial', () => {
      const { componentInstance: cmp } = TestBed.createComponent(FinancieraComponent);
      cmp.vtFlujosStr.set('');
      expect(cmp.vtFlujos()).toEqual([]);
      expect(cmp.vtVan()).toBe(-1000);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { OptimizadorComponent } from './optimizador.component';
import { OptimizadorFrontendService } from './optimizador.service';
import type { OptimizarPrecioResponse } from '@mutual-metrics/shared';

const respuestaFalsa: OptimizarPrecioResponse = {
  precioOptimo: 30,
  gananciaMaxima: 800,
  estrategiaSugerida: 'Mantener precio en 30',
};

describe('OptimizadorComponent', () => {
  let mockService: { enviarCalculo: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockService = { enviarCalculo: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OptimizadorComponent],
      providers: [{ provide: OptimizadorFrontendService, useValue: mockService }],
    }).compileComponents();
  });

  describe('renderizado', () => {
    it('renderiza título que contiene "Optimizador de Precios" y subtítulo', () => {
      const fixture = TestBed.createComponent(OptimizadorComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.textContent).toContain('Optimizador de Precios');
      expect(el.querySelector('h2')?.textContent).toContain('Optimizador de Precios');
    });

    it('renderiza los 5 campos de formulario con name correcto', () => {
      const fixture = TestBed.createComponent(OptimizadorComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('input[name="coeficienteA"]')).not.toBeNull();
      expect(el.querySelector('input[name="coeficienteB"]')).not.toBeNull();
      expect(el.querySelector('input[name="coeficienteC"]')).not.toBeNull();
      expect(el.querySelector('input[name="precioMinimo"]')).not.toBeNull();
      expect(el.querySelector('input[name="precioMaximo"]')).not.toBeNull();
      expect(el.querySelectorAll('input[type="number"]').length).toBe(5);
    });

    it('inicializa request con valores por defecto y estado nulo', () => {
      const fixture = TestBed.createComponent(OptimizadorComponent);
      const cmp = fixture.componentInstance;

      expect(cmp.request).toEqual({
        coeficienteA: -2,
        coeficienteB: 120,
        coeficienteC: -1000,
        precioMinimo: 10,
        precioMaximo: 100,
      });
      expect(cmp.resultado).toBeNull();
      expect(cmp.errorMensaje).toBeNull();
    });

    it('botón "Calcular Precio Óptimo" habilitado con coeficienteA por defecto (-2)', async () => {
      const fixture = TestBed.createComponent(OptimizadorComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const btn = (fixture.nativeElement as HTMLElement).querySelector(
        'button.btn-calcular',
      ) as HTMLButtonElement;
      expect(btn).not.toBeNull();
      expect(btn.textContent).toContain('Calcular Precio Óptimo');
      expect(btn.disabled).toBe(false);
    });

    it('botón deshabilitado si coeficienteA >= 0 (0 y positivo)', async () => {
      // Se usa un fixture fresco por caso para evitar NG0100 por el two-way binding de ngModel.
      const crearYConsultarBtn = async (coeficienteA: number) => {
        const fixture = TestBed.createComponent(OptimizadorComponent);
        fixture.componentInstance.request.coeficienteA = coeficienteA;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        const btn = (fixture.nativeElement as HTMLElement).querySelector(
          'button.btn-calcular',
        ) as HTMLButtonElement;
        fixture.destroy();
        return btn.disabled;
      };

      // caso 0 → deshabilitado
      expect(await crearYConsultarBtn(0)).toBe(true);
      // caso positivo → deshabilitado
      expect(await crearYConsultarBtn(5)).toBe(true);
      // vuelve a negativo → habilitado
      expect(await crearYConsultarBtn(-2)).toBe(false);
    });
  });

  describe('enviarCalculo()', () => {
    it('resetea errorMensaje a null, llama al service y setea resultado en éxito', () => {
      mockService.enviarCalculo.mockReturnValue(of(respuestaFalsa));
      const fixture = TestBed.createComponent(OptimizadorComponent);
      const cmp = fixture.componentInstance;

      // Simula un error previo para verificar el reset a null al re-enviar.
      cmp.errorMensaje = 'error previo';
      cmp.enviarCalculo();

      expect(cmp.errorMensaje).toBeNull();
      expect(mockService.enviarCalculo).toHaveBeenCalledTimes(1);
      expect(mockService.enviarCalculo).toHaveBeenCalledWith(cmp.request);
      expect(cmp.resultado).toEqual(respuestaFalsa);

      // renderiza tarjeta de resultado
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('$ 30');
      expect(el.textContent).toContain('$ 800');
      expect(el.textContent).toContain('Mantener precio en 30');
    });

    it('setea errorMensaje desde err.error.message cuando el backend responde BadRequest', () => {
      const errorBackend = { error: { message: 'Coeficiente A debe ser negativo' } };
      mockService.enviarCalculo.mockReturnValue(throwError(() => errorBackend));

      const fixture = TestBed.createComponent(OptimizadorComponent);
      const cmp = fixture.componentInstance;

      cmp.enviarCalculo();

      expect(cmp.resultado).toBeNull();
      expect(cmp.errorMensaje).toBe('Coeficiente A debe ser negativo');

      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.alerta-error')?.textContent).toContain(
        'Coeficiente A debe ser negativo',
      );
    });

    it('usa fallback "Error al conectar con el servidor matemático." cuando err.error es undefined', () => {
      mockService.enviarCalculo.mockReturnValue(throwError(() => ({})));
      const fixture = TestBed.createComponent(OptimizadorComponent);
      const cmp = fixture.componentInstance;

      cmp.enviarCalculo();

      expect(cmp.errorMensaje).toBe('Error al conectar con el servidor matemático.');
    });

    it('usa fallback también cuando err es null/undefined', () => {
      mockService.enviarCalculo.mockReturnValue(throwError(() => ({ error: undefined })));
      const fixture = TestBed.createComponent(OptimizadorComponent);
      const cmp = fixture.componentInstance;

      cmp.enviarCalculo();

      expect(cmp.errorMensaje).toBe('Error al conectar con el servidor matemático.');
    });

    it('usa fallback cuando err.error.message es string vacío', () => {
      mockService.enviarCalculo.mockReturnValue(throwError(() => ({ error: { message: '' } })));
      const fixture = TestBed.createComponent(OptimizadorComponent);
      const cmp = fixture.componentInstance;

      cmp.enviarCalculo();

      // '' es falsy → entra al fallback por ||
      expect(cmp.errorMensaje).toBe('Error al conectar con el servidor matemático.');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingComponent],
    }).compileComponents();
  });

  it('ngOnInit crea el form con 5 controles required inválidos al inicio', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges(); // dispara ngOnInit

    const cmp = fixture.componentInstance;
    expect(cmp.form).toBeTruthy();
    expect(cmp.form.get('coeficienteA')).not.toBeNull();
    expect(cmp.form.get('coeficienteB')).not.toBeNull();
    expect(cmp.form.get('coeficienteC')).not.toBeNull();
    expect(cmp.form.get('precioMinimo')).not.toBeNull();
    expect(cmp.form.get('precioMaximo')).not.toBeNull();

    expect(cmp.form.get('coeficienteA')!.valid).toBe(false);
    expect(cmp.form.invalid).toBe(true);
    expect(cmp.resultado).toBeNull();
  });

  it('botón deshabilitado cuando form inválido y habilitado cuando válido', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges();
    const getBtn = () =>
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;

    expect(getBtn().disabled).toBe(true);

    // completar 5 campos
    fixture.componentInstance.form.patchValue({
      coeficienteA: -2,
      coeficienteB: 120,
      coeficienteC: -1000,
      precioMinimo: 10,
      precioMaximo: 100,
    });
    fixture.detectChanges();
    expect(getBtn().disabled).toBe(false);
  });

  it('onSubmit() con form inválido no modifica resultado', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    // form aún vacío → inválido
    cmp.onSubmit();
    expect(cmp.resultado).toBeNull();
  });

  it('onSubmit() con form válido setea el objeto hardcodeado esperado', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    cmp.form.patchValue({
      coeficienteA: -2,
      coeficienteB: 120,
      coeficienteC: -1000,
      precioMinimo: 10,
      precioMaximo: 100,
    });
    expect(cmp.form.valid).toBe(true);

    cmp.onSubmit();

    expect(cmp.resultado).toEqual({
      precioOptimo: 45.2,
      gananciaMaxima: 230000.5,
      estrategiaSugerida: 'Estrategia Óptima de Temporada Alta (Simulada)',
    });
  });

  it('renderiza resultado en el DOM tras onSubmit válido', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    cmp.form.patchValue({
      coeficienteA: -2,
      coeficienteB: 120,
      coeficienteC: -1000,
      precioMinimo: 10,
      precioMaximo: 100,
    });
    cmp.onSubmit();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.resultado')).not.toBeNull();
    expect(el.textContent).toContain('45.2');
    expect(el.textContent).toContain('230000.5');
    expect(el.textContent).toContain('Estrategia Óptima de Temporada Alta (Simulada)');
  });
});

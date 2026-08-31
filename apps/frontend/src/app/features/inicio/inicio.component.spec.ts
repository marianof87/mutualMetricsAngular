import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';
import { InicioComponent } from './inicio.component';

describe('InicioComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se instancia', () => {
    const fixture = TestBed.createComponent(InicioComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza hero y links con routerLink sin romper', () => {
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.hero-titulo')?.textContent).toContain('Metrix AI');
    expect(el.querySelector('a[href]') ?? el.querySelector('[routerLink]')).not.toBeNull();
    expect(el.textContent).toContain('Calculadora Cuadrática');
  });
});

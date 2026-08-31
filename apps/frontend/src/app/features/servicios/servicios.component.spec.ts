import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';
import { ServiciosComponent } from './servicios.component';

describe('ServiciosComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se instancia', () => {
    const fixture = TestBed.createComponent(ServiciosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza "Nuestros Servicios" y 3 tarjetas', () => {
    const fixture = TestBed.createComponent(ServiciosComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Nuestros Servicios');
    expect(el.querySelectorAll('.service-card').length).toBe(3);
  });
});

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NovedadesComponent } from './novedades.component';

describe('NovedadesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovedadesComponent],
    }).compileComponents();
  });

  it('se instancia', () => {
    const fixture = TestBed.createComponent(NovedadesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza "Novedades y Actualizaciones" y grilla', () => {
    const fixture = TestBed.createComponent(NovedadesComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Novedades y Actualizaciones');
    expect(el.querySelectorAll('.novedad-card').length).toBe(4);
  });
});

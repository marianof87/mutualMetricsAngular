import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SobreNosotrosComponent } from './sobre-nosotros.component';

describe('SobreNosotrosComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SobreNosotrosComponent],
    }).compileComponents();
  });

  it('se instancia', () => {
    const fixture = TestBed.createComponent(SobreNosotrosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza contenido estable', () => {
    const fixture = TestBed.createComponent(SobreNosotrosComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Simulador de Rentabilidad');
    expect(el.textContent).toContain('Sinaptek');
  });
});

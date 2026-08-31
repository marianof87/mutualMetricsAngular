import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HistorialComponent } from './historial.component';

describe('HistorialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialComponent],
    }).compileComponents();
  });

  it('se instancia correctamente', () => {
    const fixture = TestBed.createComponent(HistorialComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza el título "Mi historial" sin error', () => {
    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Mi historial');
    expect(el.textContent).toContain('@Franco1212');
  });
});

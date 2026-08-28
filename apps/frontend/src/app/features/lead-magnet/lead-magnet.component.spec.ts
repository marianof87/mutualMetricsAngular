import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BaseChartDirective } from 'ng2-charts';
import { LeadMagnetComponent } from './lead-magnet.component';

// Stub del gráfico: jsdom no implementa canvas 2D, evitamos romper el test.
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

describe('LeadMagnetComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadMagnetComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(LeadMagnetComponent, {
        remove: { imports: [BaseChartDirective] },
        add: { imports: [CanvasStubDirective] },
      })
      .compileComponents();
  });

  it('crea el componente', () => {
    const fixture = TestBed.createComponent(LeadMagnetComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el escenario por defecto y el botón de descarga', () => {
    const fixture = TestBed.createComponent(LeadMagnetComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Descargar Informe Personalizado en PDF');
    expect(el.textContent).toContain('$ 30');
  });

  it('abre el modal al hacer clic en descargar', () => {
    const fixture = TestBed.createComponent(LeadMagnetComponent);
    fixture.detectChanges();
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      '.btn-descargar',
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.modalAbierto()).toBe(true);
  });
});
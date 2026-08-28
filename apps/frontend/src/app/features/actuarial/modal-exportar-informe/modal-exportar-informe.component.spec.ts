import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ModalExportarInformeComponent } from './modal-exportar-informe.component';

const leadValido = {
  nombre: 'Ana Pérez',
  empresa: 'Textil Sur',
  whatsapp: '+54 9 351 555-1234',
  email: 'ana@empresa.com',
};

describe('ModalExportarInformeComponent', () => {
  let componete: ModalExportarInformeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalExportarInformeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ModalExportarInformeComponent);
    componete = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no emite exportado si el formulario está incompleto y avisa', () => {
    const emitido = vi.fn();
    componete.exportado.subscribe(emitido);

    componete.enviar();

    expect(emitido).not.toHaveBeenCalled();
    expect(componete.mensajeError()).toBe('Revisá los datos del formulario.');
  });

  it('emite los datos del lead parseados al enviar un formulario válido', () => {
    const emitido = vi.fn();
    componete.exportado.subscribe(emitido);

    componete.formulario.setValue(leadValido);
    componete.enviar();

    expect(emitido).toHaveBeenCalledTimes(1);
    expect(emitido.mock.calls[0][0]).toEqual(leadValido);
  });
});
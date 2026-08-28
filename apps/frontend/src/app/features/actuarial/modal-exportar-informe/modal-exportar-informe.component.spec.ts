import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { vi } from 'vitest';
import { erroresInterceptor } from '../../../core/interceptores/errores.interceptor';
import { entorno } from '../../../core/configuracion/entorno';
import { ModalExportarInformeComponent } from './modal-exportar-informe.component';

const leadValido = {
  nombre: 'Ana Pérez',
  empresa: 'Textil Sur',
  whatsapp: '+54 9 351 555-1234',
  email: 'ana@empresa.com',
};

describe('ModalExportarInformeComponent', () => {
  let componete: ModalExportarInformeComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalExportarInformeComponent],
      providers: [
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ModalExportarInformeComponent);
    componete = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('no registra el lead si el formulario está incompleto y avisa', () => {
    componete.enviar();

    expect(componete.enviando()).toBe(false);
    expect(componete.mensajeError()).toBe('Revisá los datos del formulario.');
  });

  it('registra el lead y emite exportado con el id devuelto', () => {
    const emitido = vi.fn();
    componete.exportado.subscribe(emitido);

    componete.formulario.setValue(leadValido);
    componete.enviar();

    expect(componete.enviando()).toBe(true);

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/leads`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(leadValido);
    peticion.flush({ id: 'uuid-lead', recibidoEn: '2026-08-25T00:00:00Z' });

    expect(componete.enviando()).toBe(false);
    expect(emitido).toHaveBeenCalledTimes(1);
    expect(emitido.mock.calls[0][0]).toEqual({ lead: leadValido, leadId: 'uuid-lead' });
  });

  it('muestra el mensaje del envelope si falla el registro', () => {
    componete.formulario.setValue(leadValido);
    componete.enviar();

    const peticion = http.expectOne(`${entorno.apiBaseUrl}/leads`);
    peticion.flush(
      { error: { code: 'CONTACTO_FALLO', message: 'No se pudo registrar tu contacto.' } },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(componete.enviando()).toBe(false);
    expect(componete.mensajeError()).toBe('No se pudo registrar tu contacto.');
  });
});
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ContactoComponent } from './contacto.component';
import { ContactoService } from './contacto.service';
import type { EnvelopeError } from '@mutual-metrics/shared';

// Datos válidos según ContactoRequestSchema
const dtoValido = {
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  mensaje: 'Hola, este es un mensaje de prueba con más de diez caracteres.',
};

describe('ContactoComponent', () => {
  let mockEnviar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockEnviar = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ContactoComponent],
      providers: [{ provide: ContactoService, useValue: { enviar: mockEnviar } }],
    }).compileComponents();
  });

  it('inicializa formulario vacío, inválido y signals en null/false', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    const cmp = fixture.componentInstance;

    expect(cmp.formulario).toBeTruthy();
    expect(cmp.formulario.controls.nombre.value).toBe('');
    expect(cmp.formulario.controls.email.value).toBe('');
    expect(cmp.formulario.controls.mensaje.value).toBe('');
    expect(cmp.formulario.invalid).toBe(true);
    expect(cmp.enviando()).toBe(false);
    expect(cmp.mensajeExito()).toBeNull();
    expect(cmp.mensajeError()).toBeNull();
  });

  it('botón deshabilitado cuando el formulario está vacío/inválido', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    expect(btn).not.toBeNull();
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Enviar');
  });

  it('enviar() con formulario inválido marca touched, setea mensaje y NO llama al service', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    const cmp = fixture.componentInstance;
    // formulario vacío → safeParse falla
    cmp.enviar();

    expect(cmp.formulario.touched).toBe(true); // markAllAsTouched propaga
    expect(cmp.mensajeError()).toBe('Revisá los datos del formulario.');
    expect(cmp.mensajeExito()).toBeNull();
    expect(mockEnviar).not.toHaveBeenCalled();
    expect(cmp.enviando()).toBe(false);
  });

  it('enviar() con formulario válido llama al service, resetea y muestra mensaje de éxito', () => {
    const respuesta = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      recibidoEn: new Date().toISOString(),
    };
    mockEnviar.mockReturnValue(of(respuesta));

    const fixture = TestBed.createComponent(ContactoComponent);
    const cmp = fixture.componentInstance;

    cmp.formulario.patchValue(dtoValido);
    expect(cmp.formulario.valid).toBe(true);

    cmp.enviar();

    expect(mockEnviar).toHaveBeenCalledTimes(1);
    expect(mockEnviar).toHaveBeenCalledWith(dtoValido);
    expect(cmp.enviando()).toBe(false);
    expect(cmp.mensajeExito()).toContain('Mensaje recibido (id');
    expect(cmp.mensajeExito()).toContain(respuesta.id);
    // formulario reseteado (nonNullable group → vuelve a valores vacíos)
    expect(cmp.formulario.controls.nombre.value).toBe('');
  });

  it('enviar() con error envelope muestra envelope.error.message', () => {
    const envelope: EnvelopeError = {
      error: { code: 'ERROR_INTERNO', message: 'Email ya registrado' },
    };
    mockEnviar.mockReturnValue(throwError(() => envelope));

    const fixture = TestBed.createComponent(ContactoComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue(dtoValido);

    cmp.enviar();

    expect(cmp.enviando()).toBe(false);
    expect(cmp.mensajeError()).toBe('Email ya registrado');
    expect(cmp.mensajeExito()).toBeNull();
  });

  it('enviar() con error sin message usa fallback "No se pudo enviar el mensaje."', () => {
    mockEnviar.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(ContactoComponent);
    const cmp = fixture.componentInstance;
    cmp.formulario.patchValue(dtoValido);

    cmp.enviar();
    expect(cmp.mensajeError()).toBe('No se pudo enviar el mensaje.');

    // también con envelope sin message
    mockEnviar.mockReturnValue(throwError(() => ({ error: {} })));
    cmp.enviar();
    expect(cmp.mensajeError()).toBe('No se pudo enviar el mensaje.');
  });

  it('renderiza .error role=alert y .ok role=status según signals', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    const cmp = fixture.componentInstance;

    // sin mensajes no hay nodos
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p.error[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('p.ok[role="status"]')).toBeNull();

    // simula error de validación
    cmp.enviar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p.error[role="alert"]')?.textContent).toContain(
      'Revisá los datos del formulario.',
    );
  });
});

import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { HistorialComponent } from './historial.component';
import { HistorialService } from './historial.service';
import { ModalDetalleEscenarioComponent } from './modal-detalle-escenario/modal-detalle-escenario.component';
import type { EnvelopeError, EscenarioResponse, Paginado } from '@mutual-metrics/shared';

const escenarioBase: EscenarioResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  tipo: 'cuadratica',
  inputs: { a: 1 },
  outputs: { x1: 2, x2: 3 },
  creadoEn: '2026-09-03T12:00:00.000Z',
};

function paginado(datos: EscenarioResponse[], total: number): Paginado<EscenarioResponse> {
  return { datos, total, pagina: 1, tamano: 20 };
}

describe('HistorialComponent', () => {
  let mockListar: ReturnType<typeof vi.fn>;
  let mockBorrar: ReturnType<typeof vi.fn>;
  let mockObtenerPorId: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockListar = vi.fn();
    mockBorrar = vi.fn();
    mockObtenerPorId = vi.fn().mockReturnValue(of(escenarioBase));

    await TestBed.configureTestingModule({
      imports: [HistorialComponent],
      providers: [
        {
          provide: HistorialService,
          useValue: { listar: mockListar, borrar: mockBorrar, obtenerPorId: mockObtenerPorId },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('se instancia y muestra el título "Mi historial"', () => {
    mockListar.mockReturnValue(of(paginado([], 0)));
    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    expect(cmp).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Mi historial');
  });

  it('muestra "Cargando historial…" mientras no resuelve', () => {
    const sujeto = new Subject<Paginado<EscenarioResponse>>();
    mockListar.mockReturnValue(sujeto);

    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const estado = el.querySelector('.estado[role="status"]');
    expect(estado?.textContent).toContain('Cargando historial…');
    expect(mockListar).toHaveBeenCalledWith(1, 20);

    sujeto.complete();
  });

  it('carga exitosa puebla escenarios+total y renderiza tipo y fecha', () => {
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    expect(cmp.estaCargando()).toBe(false);
    expect(cmp.escenarios().length).toBe(1);
    expect(cmp.total()).toBe(1);

    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.historial-item');
    expect(items.length).toBe(1);
    expect(items[0].querySelector('.historial-tipo')?.textContent).toContain('Cuadrática');
    expect(items[0].querySelector('.historial-fecha')?.getAttribute('datetime')).toBe(
      escenarioBase.creadoEn,
    );
  });

  it('estado vacío muestra el mensaje y no lista ni paginación', () => {
    mockListar.mockReturnValue(of(paginado([], 0)));

    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.estado[role="status"]')?.textContent).toContain(
      'Todavía no guardaste ningún cálculo.',
    );
    expect(el.querySelector('.historial-lista')).toBeNull();
    expect(el.querySelector('.paginacion')).toBeNull();
  });

  it('estado error setea error y muestra role=alert', () => {
    const envelope: EnvelopeError = {
      error: { code: 'ERROR_INTERNO', message: 'El servidor falló' },
    };
    mockListar.mockReturnValue(throwError(() => envelope));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    expect(cmp.estaCargando()).toBe(false);
    expect(cmp.error()).toBe('El servidor falló');
    const alerta = fixture.nativeElement.querySelector('.estado.error[role="alert"]');
    expect(alerta).not.toBeNull();
    expect(alerta?.textContent).toContain('El servidor falló');
  });

  it('error sin message usa fallback "No se pudo cargar el historial."', () => {
    // Envelope malformado (sin message) — caso real en runtime si el backend
    // responde un body inesperado. El cast documenta esta intención.
    const envelope = {} as EnvelopeError;
    mockListar.mockReturnValue(throwError(() => envelope));

    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('No se pudo cargar el historial.');
  });

  it('error de token rechazado no muestra mensaje propio', () => {
    const envelope: EnvelopeError = {
      error: { code: 'AUTH_TOKEN_EXPIRADO', message: 'Sesión expirada' },
    };
    mockListar.mockReturnValue(throwError(() => envelope));

    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('paginación: Siguiente llama listar(2, ...) y actualiza la vista', () => {
    const total = 30; // con tamano 20 → 2 páginas
    mockListar
      .mockReturnValueOnce(of(paginado([escenarioBase], total)))
      .mockReturnValueOnce(of(paginado([{ ...escenarioBase, id: 'segunda' }], total)));

    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();

    expect(mockListar).toHaveBeenNthCalledWith(1, 1, 20);

    const siguiente = (fixture.nativeElement as HTMLElement).querySelectorAll('.paginacion button')[1];
    (siguiente as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(mockListar).toHaveBeenNthCalledWith(2, 2, 20);
    expect(fixture.componentInstance.pagina()).toBe(2);
  });

  it('botón Anterior deshabilitado en página 1 y Siguiente en la última', () => {
    mockListar.mockReturnValue(of(paginado([escenarioBase], 30)));

    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('.paginacion button');
    const anterior = botones[0] as HTMLButtonElement;
    const siguiente = botones[1] as HTMLButtonElement;

    expect(anterior.disabled).toBe(true);
    expect(siguiente.disabled).toBe(false);
  });

  it('borrar con confirm=true llama al servicio y recarga', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));
    mockBorrar.mockReturnValue(of(undefined));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    cmp.borrar(escenarioBase.id);

    expect(mockBorrar).toHaveBeenCalledWith(escenarioBase.id);
    // recarga la página tras borrar y limpia el estado de error.
    expect(mockListar).toHaveBeenCalledTimes(2);
    expect(cmp.error()).toBeNull();
  });

  it('borrar con confirm=false NO llama al servicio', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));

    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();

    fixture.componentInstance.borrar(escenarioBase.id);

    expect(mockBorrar).not.toHaveBeenCalled();
    expect(mockListar).toHaveBeenCalledTimes(1);
  });

  it('durante el borrado el botón queda deshabilitado', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const borrado = new Subject<void>();
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));
    mockBorrar.mockReturnValue(borrado);

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    cmp.borrar(escenarioBase.id);
    fixture.detectChanges();

    expect(cmp.borrandoIds().has(escenarioBase.id)).toBe(true);
    const boton = (fixture.nativeElement as HTMLElement).querySelector('.btn-advertencia');
    expect((boton as HTMLButtonElement).disabled).toBe(true);
    expect((boton as HTMLButtonElement).textContent).toContain('Borrando...');

    borrado.complete();
  });

  it('borrar con error setea error y limpia borrandoIds', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const envelope: EnvelopeError = {
      error: { code: 'ERROR_INTERNO', message: 'No se pudo borrar el escenario' },
    };
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));
    mockBorrar.mockReturnValue(throwError(() => envelope));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    cmp.borrar(escenarioBase.id);

    expect(cmp.error()).toBe('No se pudo borrar el escenario');
    expect(cmp.borrandoIds().has(escenarioBase.id)).toBe(false);
  });

  it('borrar el último ítem de una página retrocede a la anterior', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockBorrar.mockReturnValue(of(undefined));
    // Primera carga: página 2 con 1 ítem (total 30 → 2 páginas).
    mockListar
      .mockReturnValueOnce(of({ datos: [escenarioBase], total: 30, pagina: 2, tamano: 20 }))
      .mockReturnValueOnce(of(paginado([], 0)));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    cmp.pagina.set(2);
    fixture.detectChanges();

    cmp.borrar(escenarioBase.id);

    // Tras borrar el único ítem de la página 2, recarga la página 1.
    expect(mockListar).toHaveBeenCalledTimes(2);
    expect(mockListar).toHaveBeenLastCalledWith(1, 20);
  });

  it('click en "Ver" abre el modal y pasa el id correcto al detalle', () => {
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    const botonVer = (fixture.nativeElement as HTMLElement).querySelector(
      '.historial-item .btn-secundario',
    );
    (botonVer as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cmp.modalAbierto()).toBe(true);
    expect(cmp.escenarioDetalleId()).toBe(escenarioBase.id);

    const modal = fixture.nativeElement.querySelector('app-modal-detalle-escenario');
    expect(modal).not.toBeNull();

    const childDebug = fixture.debugElement.query(
      By.css('app-modal-detalle-escenario'),
    );
    const child = childDebug.componentInstance as ModalDetalleEscenarioComponent;
    // El input escenarioId del modal recibe el id del escenario clickeado.
    expect(child.escenarioId()).toBe(escenarioBase.id);
    // Al montarse con el id, el modal dispara la carga del detalle en el servicio.
    expect(mockObtenerPorId).toHaveBeenCalledWith(escenarioBase.id);
  });

  it('emitir "cerrado" desde el modal cierra el detalle', () => {
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    cmp.verDetalle(escenarioBase.id);
    fixture.detectChanges();
    expect(cmp.modalAbierto()).toBe(true);

    const childDebug = fixture.debugElement.query(
      By.css('app-modal-detalle-escenario'),
    );
    (childDebug.componentInstance as ModalDetalleEscenarioComponent).cerrar();
    fixture.detectChanges();

    expect(cmp.modalAbierto()).toBe(false);
    expect(cmp.escenarioDetalleId()).toBeNull();
    expect(fixture.nativeElement.querySelector('app-modal-detalle-escenario')).toBeNull();
  });

  it('cerrarDetalle limpia el id y el modal desaparece del DOM', () => {
    mockListar.mockReturnValue(of(paginado([escenarioBase], 1)));
    mockObtenerPorId.mockReturnValue(of(escenarioBase));

    const fixture = TestBed.createComponent(HistorialComponent);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    cmp.verDetalle(escenarioBase.id);
    fixture.detectChanges();
    cmp.cerrarDetalle();
    fixture.detectChanges();

    expect(cmp.modalAbierto()).toBe(false);
    expect(cmp.escenarioDetalleId()).toBeNull();
    expect(fixture.nativeElement.querySelector('app-modal-detalle-escenario')).toBeNull();
  });
});

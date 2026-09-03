import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CODIGOS_TOKEN_RECHAZADO, type EnvelopeError, type EscenarioResponse } from '@mutual-metrics/shared';
import { HistorialService } from './historial.service';
import { ModalDetalleEscenarioComponent } from './modal-detalle-escenario/modal-detalle-escenario.component';
import { inputsReEjecutables, rutaReEjecutar } from './reejecutar.helper';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, ModalDetalleEscenarioComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css',
})
export class HistorialComponent implements OnInit, OnDestroy {
  private readonly servicio = inject(HistorialService);
  private readonly router = inject(Router);
  private suscripcionListado?: Subscription;

  readonly estaCargando = signal(true);
  readonly escenarios = signal<EscenarioResponse[]>([]);
  readonly total = signal(0);
  readonly tamano = signal(20);
  readonly pagina = signal(1);
  readonly error = signal<string | null>(null);
  // Error específico de la acción "re-ejecutar", separado del error general del
  // listado para que uno no sobrescriba al otro si ocurren en secuencia.
  readonly errorReEjecutar = signal<string | null>(null);
  readonly borrandoIds = signal<Set<string>>(new Set());
  readonly modalAbierto = signal(false);
  readonly escenarioDetalleId = signal<string | null>(null);

  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.tamano()));

  ngOnInit(): void {
    this.cargarPagina(1);
  }

  // Evita fugas de memoria: cancela la petición en vuelo si el componente se
  // destruye antes de que resuelva.
  ngOnDestroy(): void {
    this.suscripcionListado?.unsubscribe();
  }

  cargarPagina(pagina: number): void {
    this.suscripcionListado?.unsubscribe();
    this.pagina.set(pagina);
    this.estaCargando.set(true);
    this.error.set(null);

    this.suscripcionListado = this.servicio.listar(pagina, this.tamano()).subscribe({
      next: (respuesta) => {
        this.escenarios.set(respuesta.datos);
        this.total.set(respuesta.total);
        this.estaCargando.set(false);
        // Si la página quedó vacía (p.ej. luego de borrar) pero hay más datos,
        // retrocedemos una página para volver a una con contenido.
        if (respuesta.datos.length === 0 && respuesta.total > 0 && pagina > 1) {
          this.cargarPagina(pagina - 1);
        }
      },
      error: (envelope: EnvelopeError) => {
        this.estaCargando.set(false);
        this.error.set(this.mensajeErrorAmigable(envelope));
      },
    });
  }

  cambiarPagina(pagina: number): void {
    this.cargarPagina(pagina);
  }

  borrar(id: string): void {
    const confirma = window.confirm(
      '¿Borrar el escenario? Esta acción quita este escenario del historial.',
    );
    if (!confirma) return;

    const ids = new Set(this.borrandoIds());
    ids.add(id);
    this.borrandoIds.set(ids);

    this.servicio.borrar(id).subscribe({
      next: () => {
        const paginaActual = this.pagina();
        const quedoUnSoloItem = this.escenarios().length === 1;
        this.cargarPagina(quedoUnSoloItem && paginaActual > 1 ? paginaActual - 1 : paginaActual);
        this.quitarDeBorrando(id);
      },
      error: (envelope: EnvelopeError) => {
        this.error.set(this.mensajeErrorAmigable(envelope));
        this.quitarDeBorrando(id);
      },
    });
  }

  etiquetaTipo(tipo: EscenarioResponse['tipo']): string {
    return tipo === 'cuadratica' ? 'Cuadrática' : 'Pricing';
  }

  verDetalle(id: string): void {
    this.escenarioDetalleId.set(id);
    this.modalAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalAbierto.set(false);
    this.escenarioDetalleId.set(null);
  }

  // Navega a la calculadora correspondiente al tipo del escenario pasando sus
  // inputs como estado de navegación. Si el tipo no es re-ejecutable o los
  // inputs no son compatibles, bloquea la navegación y muestra un aviso en vez
  // de llegar a una calculadora vacía o a una ruta inexistente.
  reejecutar(esc: EscenarioResponse): void {
    const ruta = rutaReEjecutar(esc.tipo);
    if (!ruta || !inputsReEjecutables(esc.inputs)) {
      this.errorReEjecutar.set(
        'No se puede re-ejecutar este escenario: los datos guardados no son compatibles con la calculadora.',
      );
      return;
    }
    this.errorReEjecutar.set(null);
    void this.router.navigate([ruta], { state: { inputs: esc.inputs } });
  }

  private quitarDeBorrando(id: string): void {
    const ids = new Set(this.borrandoIds());
    ids.delete(id);
    this.borrandoIds.set(ids);
  }

  // Cuando el token ya no es válido, el interceptor redirige a /login y no
  // tiene sentido mostrar un mensaje de error propio en esta vista.
  private mensajeErrorAmigable(envelope: EnvelopeError): string | null {
    if (CODIGOS_TOKEN_RECHAZADO.includes(envelope?.error?.code)) return null;
    return envelope?.error?.message ?? 'No se pudo cargar el historial.';
  }
}

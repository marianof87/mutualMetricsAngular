import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CODIGOS_TOKEN_RECHAZADO, type EnvelopeError, type EscenarioResponse } from '@mutual-metrics/shared';
import { HistorialService } from './historial.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css',
})
export class HistorialComponent implements OnInit, OnDestroy {
  private readonly servicio = inject(HistorialService);
  private suscripcionListado?: Subscription;

  readonly estaCargando = signal(true);
  readonly escenarios = signal<EscenarioResponse[]>([]);
  readonly total = signal(0);
  readonly tamano = signal(20);
  readonly pagina = signal(1);
  readonly error = signal<string | null>(null);
  readonly borrandoIds = signal<Set<string>>(new Set());

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

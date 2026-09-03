import {
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CODIGOS_TOKEN_RECHAZADO, type EnvelopeError, type EscenarioResponse } from '@mutual-metrics/shared';
import { HistorialService } from '../historial.service';

@Component({
  selector: 'app-modal-detalle-escenario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle-escenario.component.html',
  styleUrl: './modal-detalle-escenario.component.css',
})
export class ModalDetalleEscenarioComponent implements OnDestroy {
  private readonly servicio = inject(HistorialService);
  private suscripcionDetalle?: Subscription;

  readonly escenarioId = input.required<string>();
  readonly cerrado = output<void>();

  readonly estaCargando = signal(true);
  readonly escenario = signal<EscenarioResponse | null>(null);
  readonly error = signal<string | null>(null);

  // Al cambiar el id del escenario a mostrar, dispara la carga del detalle.
  // La suscripción previa se cancela en cargarEscenario para no pisar con una
  // petición más nueva ni provocar fugas de memoria.
  private readonly cargarAlCambiar = effect(() => {
    this.cargarEscenario(this.escenarioId());
  });

  // Evita fugas de memoria: cancela la petición si el modal se destruye antes
  // de que resuelva.
  ngOnDestroy(): void {
    this.suscripcionDetalle?.unsubscribe();
  }

  cargarEscenario(id: string): void {
    this.suscripcionDetalle?.unsubscribe();
    this.estaCargando.set(true);
    this.error.set(null);
    this.escenario.set(null);

    this.suscripcionDetalle = this.servicio.obtenerPorId(id).subscribe({
      next: (detalle) => {
        this.escenario.set(detalle);
        this.estaCargando.set(false);
      },
      error: (envelope: EnvelopeError) => {
        this.estaCargando.set(false);
        this.error.set(this.mensajeErrorAmigable(envelope));
      },
    });
  }

  cerrar(): void {
    this.cerrado.emit();
  }

  // Helper reutilizable para recorrer los pares clave/valor de inputs y outputs.
  claves(objeto: Record<string, unknown>): string[] {
    return Object.keys(objeto ?? {});
  }

  // Serializa un valor para mostrarlo: los primitivos simples tal cual y los
  // objetos/arrays indentados para que sean legibles en el detalle.
  formatoValor(valor: unknown): string {
    if (valor === null || valor === undefined) return '—';
    if (typeof valor === 'string') return valor;
    return JSON.stringify(valor, null, 2);
  }

  etiquetaTipo(tipo: EscenarioResponse['tipo']): string {
    return tipo === 'cuadratica' ? 'Cuadrática' : 'Pricing';
  }

  // Cuando el token ya no es válido, el interceptor redirige a /login y no
  // tiene sentido mostrar un mensaje de error propio en esta vista.
  private mensajeErrorAmigable(envelope: EnvelopeError): string | null {
    if (CODIGOS_TOKEN_RECHAZADO.includes(envelope?.error?.code)) return null;
    return envelope?.error?.message ?? 'No se pudo cargar el escenario.';
  }
}

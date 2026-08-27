import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import type {
  GuardarSimulacionActuarial,
  ParametroEstocastico,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';
import { simularRiesgoAsync } from '@mutual-metrics/shared';
import { ActuarialService } from './actuarial.service';
import type { InformeExportado } from './modal-exportar-informe/modal-exportar-informe.component';
import { ModalExportarInformeComponent } from './modal-exportar-informe/modal-exportar-informe.component';
import { InformeActuarialPdfService } from './servicios/informe-actuarial-pdf.service';

type ModoParametro = 'fijo' | 'triangular' | 'normal';

@Component({
  selector: 'app-actuarial',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, ModalExportarInformeComponent],
  templateUrl: './actuarial.component.html',
  styleUrl: './actuarial.component.css',
})
export class ActuarialComponent {
  private readonly servicio = inject(ActuarialService);
  private readonly informePdf = inject(InformeActuarialPdfService);

  // Coeficiente A — sensibilidad de la demanda (estocástico)
  modoA = signal<ModoParametro>('triangular');
  aMinimo = signal(-3);
  aModa = signal(-2);
  aMaximo = signal(-1);
  aValor = signal(-2);

  // Coeficiente B — demanda base (estocástico)
  modoB = signal<ModoParametro>('fijo');
  bMinimo = signal(100);
  bModa = signal(120);
  bMaximo = signal(140);
  bValor = signal(120);
  bConfianza = signal(0.9);

  // Coeficiente C — término independiente neto (costos fijos con signo; estocástico)
  modoC = signal<ModoParametro>('normal');
  cMinimo = signal(-1100);
  cModa = signal(-1000);
  cMaximo = signal(-900);
  cValor = signal(-1000);
  cConfianza = signal(0.9);

  precioMinimo = signal(10);
  precioMaximo = signal(100);
  precioActual = signal<number | null>(null);
  nSimulaciones = signal(10_000);
  nivelConfianza = signal(0.95);
  semilla = signal<number | null>(null);

  cargando = signal(false);
  error = signal<string | null>(null);
  resultado = signal<SimulacionActuarialResponse | null>(null);
  guardado = signal<'pendiente' | 'guardando' | 'ok' | 'error'>('pendiente');
  modalAbierto = signal(false);

  sinIncertidumbre = computed(
    () => this.modoA() === 'fijo' && this.modoB() === 'fijo' && this.modoC() === 'fijo',
  );

  curvaData = computed<ChartConfiguration<'line'>['data']>(() => {
    const resultado = this.resultado();
    if (!resultado) return { labels: [], datasets: [] };
    return {
      labels: resultado.curvaRiesgo.map((punto) => punto.precio.toFixed(0)),
      datasets: [
        {
          data: resultado.curvaRiesgo.map((punto) => punto.probabilidadPerdida * 100),
          label: 'Probabilidad de pérdida (%)',
          fill: true,
          backgroundColor: 'rgba(243, 147, 43, 0.15)',
          borderColor: '#f0932b',
          pointRadius: 0,
        },
      ],
    };
  });

  opcionesCurva: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const precio = context.label;
            const prob = context.parsed.y;
            return `A $${precio}: ${prob}% de probabilidad de pérdida`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Precio', color: '#f0932b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a0a5b8', maxTicksLimit: 10 },
      },
      y: {
        title: { display: true, text: 'Riesgo de pérdida %', color: '#f0932b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a0a5b8' },
        min: 0,
        max: 100,
      },
    },
  };

  cambiarModoA(modo: string): void {
    this.modoA.set(modo as ModoParametro);
  }

  cambiarModoB(modo: string): void {
    this.modoB.set(modo as ModoParametro);
  }

  cambiarModoC(modo: string): void {
    this.modoC.set(modo as ModoParametro);
  }

  simular(): void {
    if (this.sinIncertidumbre() || this.cargando()) return;
    this.cargando.set(true);
    this.error.set(null);

    const solicitud = this.construirSolicitud();

    setTimeout(async () => {
      try {
        const resultado = await simularRiesgoAsync(solicitud);
        this.resultado.set(resultado);
        this.guardado.set('pendiente');
      } catch (e) {
        this.error.set(e instanceof Error ? e.message : 'No se pudo completar la simulación.');
      } finally {
        this.cargando.set(false);
      }
    }, 0);
  }

  guardarResultado(leadId?: string): void {
    const resultado = this.resultado();
    if (!resultado || this.guardado() === 'guardando') return;

    this.guardado.set('guardando');

    const solicitud = this.construirSolicitud();
    const esEstocastico =
      typeof solicitud.coeficienteB === 'object' && solicitud.coeficienteB.tipo !== 'fijo';

    const payload: GuardarSimulacionActuarial = {
      leadId,
      coeficienteBTipo: esEstocastico ? 'estocástico' : 'fijo',
      nSimulaciones: resultado.nSimulaciones,
      nivelConfianza: resultado.nivelConfianza,
      precioOptimoMedia: resultado.precioOptimo.media,
      precioOptimoP5:
        resultado.precioOptimo.percentiles['5'] ?? resultado.precioOptimo.intervalo.minimo,
      precioOptimoP95:
        resultado.precioOptimo.percentiles['95'] ?? resultado.precioOptimo.intervalo.maximo,
      pisoSolvencia: resultado.pisoSolvencia,
      probPerdidaOptimo: resultado.probabilidadPerdida.enPrecioOptimo,
      probPerdidaActual: resultado.probabilidadPerdida.enPrecioActual ?? null,
    };

    this.servicio.guardar(payload).subscribe({
      next: () => this.guardado.set('ok'),
      error: () => this.guardado.set('error'),
    });
  }

  abrirModal(): void {
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  exportarInforme(datos: InformeExportado): void {
    const resultado = this.resultado();
    this.cerrarModal();
    if (!resultado) return;

    this.guardado.set('pendiente');
    this.guardarResultado(datos.leadId);

    const solicitud = this.construirSolicitud();
    const esEstocastico =
      typeof solicitud.coeficienteB === 'object' && solicitud.coeficienteB.tipo !== 'fijo';

    void this.informePdf.generarPdf({
      lead: datos.lead,
      resultado,
      coeficienteBTipo: esEstocastico ? 'estocástico' : 'fijo',
    });
  }

  private construirSolicitud() {
    return {
      coeficienteA: this.construirParametro(
        this.modoA(),
        this.aValor(),
        this.aMinimo(),
        this.aModa(),
        this.aMaximo(),
        0.9,
      ),
      coeficienteB: this.construirParametro(
        this.modoB(),
        this.bValor(),
        this.bMinimo(),
        this.bModa(),
        this.bMaximo(),
        this.bConfianza(),
      ),
      coeficienteC: this.construirParametro(
        this.modoC(),
        this.cValor(),
        this.cMinimo(),
        this.cModa(),
        this.cMaximo(),
        this.cConfianza(),
      ),
      precioMinimo: this.precioMinimo(),
      precioMaximo: this.precioMaximo(),
      precioActual: this.precioActual() ?? undefined,
      nSimulaciones: this.nSimulaciones(),
      nivelConfianza: this.nivelConfianza(),
      semilla: this.semilla() ?? undefined,
    };
  }

  private construirParametro(
    modo: ModoParametro,
    valor: number,
    minimo: number,
    moda: number,
    maximo: number,
    confianza: number,
  ): ParametroEstocastico {
    switch (modo) {
      case 'fijo':
        return { tipo: 'fijo', valor };
      case 'triangular':
        return { tipo: 'triangular', minimo, moda, maximo };
      case 'normal':
        return { tipo: 'normal', minimo, maximo, nivelConfianza: confianza };
    }
  }

  percentilesDe(resultado: SimulacionActuarialResponse): { clave: string; valor: number }[] {
    const percentiles = resultado.precioOptimo.percentiles;
    return Object.entries(percentiles).map(([clave, valor]) => ({
      clave,
      valor,
    }));
  }
}
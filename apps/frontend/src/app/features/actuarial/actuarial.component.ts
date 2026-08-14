import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import type {
  EnvelopeError,
  ParametroEstocastico,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';
import { ActuarialService } from './actuarial.service';

type ModoParametro = 'fijo' | 'triangular' | 'normal';

@Component({
  selector: 'app-actuarial',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './actuarial.component.html',
  styleUrl: './actuarial.component.css',
})
export class ActuarialComponent {
  private readonly servicio = inject(ActuarialService);

  // Coeficiente A — sensibilidad de la demanda (estocástico)
  modoA = signal<ModoParametro>('triangular');
  aMinimo = signal(-3);
  aModa = signal(-2);
  aMaximo = signal(-1);
  aValor = signal(-2);

  coeficienteB = signal(120);

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

  sinIncertidumbre = computed(
    () => this.modoA() === 'fijo' && this.modoC() === 'fijo',
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
    plugins: {
      legend: { labels: { color: '#f8f9fa' } },
    },
    scales: {
      x: {
        title: { display: true, text: 'Precio', color: '#f0932b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a0a5b8' },
      },
      y: {
        title: { display: true, text: 'P(pérdida) %', color: '#f0932b' },
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

  cambiarModoC(modo: string): void {
    this.modoC.set(modo as ModoParametro);
  }

  simular(): void {
    if (this.sinIncertidumbre() || this.cargando()) return;
    this.cargando.set(true);
    this.error.set(null);

    const solicitud = {
      coeficienteA: this.construirParametro(
        this.modoA(),
        this.aValor(),
        this.aMinimo(),
        this.aModa(),
        this.aMaximo(),
        0.9,
      ),
      coeficienteB: this.coeficienteB(),
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

    this.servicio.simular(solicitud).subscribe({
      next: (respuesta) => {
        this.resultado.set(respuesta);
        this.cargando.set(false);
      },
      error: (error: EnvelopeError) => {
        this.error.set(error.error?.message ?? 'No se pudo completar la simulación.');
        this.cargando.set(false);
      },
    });
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
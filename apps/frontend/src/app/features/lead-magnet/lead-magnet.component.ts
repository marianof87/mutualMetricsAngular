import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartOptions } from 'chart.js';
import type { LeadRequest } from '@mutual-metrics/shared';
import { LeadMagnetModelo } from './lead-magnet.model';
import { ModalCapturaLeadComponent } from './modal-captura-lead/modal-captura-lead.component';
import { InformePdfService } from './servicios/informe-pdf.service';

@Component({
  selector: 'app-lead-magnet',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, ModalCapturaLeadComponent],
  templateUrl: './lead-magnet.component.html',
  styleUrl: './lead-magnet.component.css',
})
export class LeadMagnetComponent {
  readonly modelo = new LeadMagnetModelo();
  readonly modalAbierto = signal(false);
  readonly mensajeExito = signal<string | null>(null);

  private readonly informePdf = inject(InformePdfService);

  readonly lineChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const curva = this.modelo.curva();
    const radioPuntos = curva.datos.map(() => 0);
    const coloresPuntos = curva.datos.map(() => '#3a7bd5');

    if (curva.optimo) {
      const indice = this.indiceMasCercano(curva.labels, curva.optimo.x);
      radioPuntos[indice] = 7;
      coloresPuntos[indice] = '#00d2ff';
    }

    return {
      labels: curva.labels.map((v) => String(v)),
      datasets: [
        {
          label: 'Ganancia estimada',
          data: curva.datos,
          fill: true,
          backgroundColor: 'rgba(0, 210, 255, 0.08)',
          borderColor: '#3a7bd5',
          pointRadius: radioPuntos,
          pointBackgroundColor: coloresPuntos,
          tension: 0.3,
        },
      ],
    };
  });

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Precio ($)' }, ticks: { color: '#a0a5b8' } },
      y: { title: { display: true, text: 'Ganancia ($)' }, ticks: { color: '#a0a5b8' } },
    },
    plugins: {
      legend: { labels: { color: '#f8f9fa' } },
    },
  };

  private indiceMasCercano(valores: number[], objetivo: number): number {
    return valores.reduce(
      (mejor, valor, indice) =>
        Math.abs(valor - objetivo) < Math.abs(valores[mejor] - objetivo) ? indice : mejor,
      0,
    );
  }

  abrirModal(): void {
    if (this.modelo.resultados()) {
      this.mensajeExito.set(null);
      this.modalAbierto.set(true);
    }
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  onRegistrado(lead: LeadRequest): void {
    const resultados = this.modelo.resultados();
    if (!resultados) {
      this.cerrarModal();
      return;
    }

    this.cerrarModal();
    void this.informePdf
      .generarPdf({
        lead,
        resultados,
        coeficientes: {
          a: this.modelo.coeficienteA(),
          b: this.modelo.coeficienteB(),
          c: this.modelo.coeficienteC(),
        },
      })
      .then(() => {
        this.mensajeExito.set(`Informe generado. Te contactamos a ${lead.email} en breve.`);
      })
      .catch(() => {
        this.mensajeExito.set('Tu contacto se registró, pero no se pudo generar el PDF.');
      });
  }
}

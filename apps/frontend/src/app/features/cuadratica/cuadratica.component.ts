import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { CuadraticaRequestSchema, EnvelopeError, type CuadraticaResponse } from '@mutual-metrics/shared';
import { CuadraticaService } from './cuadratica.service';

/** Resuelve un token CSS en runtime (Chart.js no interpreta `var(--...)`). */
function colorToken(nombre: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return valor || fallback;
}

function esFinito(control: AbstractControl): ValidationErrors | null {
  return Number.isFinite(control.value) ? null : { noFinito: true };
}

function aNoCero(control: AbstractControl): ValidationErrors | null {
  if (!Number.isFinite(control.value) || control.value === 0) {
    return { aInvalido: true };
  }
  return null;
}

@Component({
  selector: 'app-cuadratica',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, BaseChartDirective],
  templateUrl: './cuadratica.component.html',
  styleUrl: './cuadratica.component.css',
})
export class CuadraticaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(CuadraticaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly enviando = signal(false);
  readonly resultado = signal<CuadraticaResponse | null>(null);
  readonly mensajeError = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    a: [1, [Validators.required, aNoCero]],
    b: [-4, [Validators.required, esFinito]],
    c: [4, [Validators.required, esFinito]],
  });

  lineChartData = signal<ChartConfiguration<'line'>['data']>({
    labels: [],
    datasets: [],
  });

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 },
      point: { radius: 2 },
    },
    scales: {
      x: {
        title: { display: true, text: 'X', color: colorToken('--mm-color-acento', '#00d2ff') },
        grid: { color: colorToken('--mm-color-borde-vidrio', 'rgba(255, 255, 255, 0.08)') },
        ticks: { color: colorToken('--mm-color-texto-tenue', '#a0a5b8') },
      },
      y: {
        title: { display: true, text: 'f(X)', color: colorToken('--mm-color-acento', '#00d2ff') },
        grid: { color: colorToken('--mm-color-borde-vidrio', 'rgba(255, 255, 255, 0.08)') },
        ticks: { color: colorToken('--mm-color-texto-tenue', '#a0a5b8') },
      },
    },
    plugins: {
      legend: { labels: { color: colorToken('--mm-color-texto', '#f8f9fa') } },
    },
  };

  ngOnInit(): void {
    const state = history.state as Record<string, unknown> | undefined;
    const inputs = state?.['inputs'] as Record<string, unknown> | undefined;
    let hayInputs = false;
    if (inputs && typeof inputs === 'object') {
      if (typeof inputs['a'] === 'number' && Number.isFinite(inputs['a'])) {
        this.formulario.controls.a.setValue(inputs['a']);
        hayInputs = true;
      }
      if (typeof inputs['b'] === 'number' && Number.isFinite(inputs['b'])) {
        this.formulario.controls.b.setValue(inputs['b']);
        hayInputs = true;
      }
      if (typeof inputs['c'] === 'number' && Number.isFinite(inputs['c'])) {
        this.formulario.controls.c.setValue(inputs['c']);
        hayInputs = true;
      }
    }
    if (hayInputs) {
      this.resolver();
    }
    this.actualizarGrafico();
  }

  resolver(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensajeError.set('El coeficiente a debe ser un número distinto de cero.');
      return;
    }

    const dto = {
      a: Number(this.formulario.controls.a.value),
      b: Number(this.formulario.controls.b.value),
      c: Number(this.formulario.controls.c.value),
    };
    const parseado = CuadraticaRequestSchema.safeParse(dto);
    if (!parseado.success) {
      this.formulario.markAllAsTouched();
      this.mensajeError.set('Revisá los coeficientes ingresados.');
      return;
    }

    this.enviando.set(true);
    this.mensajeError.set(null);
    this.servicio
      .resolver(parseado.data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.resultado.set(respuesta);
          this.enviando.set(false);
        },
        error: (envelope: EnvelopeError) => {
          this.enviando.set(false);
          this.mensajeError.set(envelope?.error?.message ?? 'No se pudo resolver la ecuación');
        },
      });
  }

  actualizarGrafico(): void {
    const a = Number(this.formulario.controls.a.value);
    const b = Number(this.formulario.controls.b.value);
    const c = Number(this.formulario.controls.c.value);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || a === 0) {
      return;
    }

    const vx = -b / (2 * a);
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = vx - 10; i <= vx + 10; i += 0.5) {
      labels.push(i.toFixed(1));
      data.push(a * Math.pow(i, 2) + b * i + c);
    }

    this.lineChartData.set({
      labels,
      datasets: [
        {
          data,
          label: `f(x) = ${a}x² + ${b}x + ${c}`,
          fill: true,
          backgroundColor: colorToken('--mm-color-primario', '#3a7bd5'),
          borderColor: colorToken('--mm-color-acento', '#00d2ff'),
          pointBackgroundColor: colorToken('--mm-color-advertencia', '#f0932b'),
        },
      ],
    });
  }

  formatear(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  }

  etiquetaTipo(tipo: CuadraticaResponse['tipo']): string {
    const etiquetas: Record<CuadraticaResponse['tipo'], string> = {
      dosReales: 'Dos raíces reales',
      unaRealDoble: 'Una raíz real doble',
      sinRaicesReales: 'Sin raíces reales',
    };
    return etiquetas[tipo] ?? tipo;
  }
}

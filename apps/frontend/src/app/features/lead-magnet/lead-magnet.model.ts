import { computed, signal } from '@angular/core';
import { optimizarPrecio, type OptimizarPrecioResponse } from '@mutual-metrics/shared';

/**
 * Estado y lógica del lead magnet de precios.
 * Aislado del componente para poder testearlo sin el DOM.
 */
export class LeadMagnetModelo {
  readonly coeficienteA = signal(-2);
  readonly coeficienteB = signal(120);
  readonly coeficienteC = signal(-1000);
  readonly precioMinimo = signal(10);
  readonly precioMaximo = signal(100);

  readonly resultados = computed<OptimizarPrecioResponse | null>(() => {
    if (this.coeficienteA() >= 0 || this.precioMinimo() > this.precioMaximo()) {
      return null;
    }
    return optimizarPrecio({
      coeficienteA: this.coeficienteA(),
      coeficienteB: this.coeficienteB(),
      coeficienteC: this.coeficienteC(),
      precioMinimo: this.precioMinimo(),
      precioMaximo: this.precioMaximo(),
    });
  });

  readonly curva = computed<{ labels: number[]; datos: number[]; optimo: { x: number; y: number } | null }>(
    () => {
      const resultado = this.resultados();
      if (!resultado) {
        return { labels: [], datos: [], optimo: null };
      }

      const minimo = this.precioMinimo();
      const maximo = this.precioMaximo();
      const pasos = 24;
      const labels: number[] = [];
      const datos: number[] = [];

      for (let i = 0; i <= pasos; i++) {
        const precio = minimo + ((maximo - minimo) * i) / pasos;
        const ganancia =
          this.coeficienteA() * Math.pow(precio, 2) +
          this.coeficienteB() * precio +
          this.coeficienteC();
        labels.push(Number(precio.toFixed(2)));
        datos.push(Number(ganancia.toFixed(2)));
      }

      return {
        labels,
        datos,
        optimo: { x: resultado.precioOptimo, y: resultado.gananciaMaxima },
      };
    },
  );
}

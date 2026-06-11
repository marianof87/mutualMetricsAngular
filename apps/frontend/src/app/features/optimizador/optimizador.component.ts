import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OptimizadorFrontendService } from './optimizador.service'; // Usamos tu servicio del frontend
import { OptimizarPrecioRequest, OptimizarPrecioResponse } from '@mutual-metrics/shared';

@Component({
  selector: 'app-optimizador',
  standalone: true,
  imports: [CommonModule, FormsModule], // Volamos HttpClientModule de acá porque se declara en el config global
  template: `
    <div class="contenedor-optimizador">
      <div class="tarjeta-formulario">
        <h2>Slice 3: Optimizador de Precios</h2>
        <p class="subtitulo">Ingrese los coeficientes de la función cuadrática de beneficio para calcular el precio ideal.</p>
        
        <form (ngSubmit)="enviarCalculo()" #formOptimizador="ngForm">
          <div class="grupo-campo">
            <label>Coeficiente A (Debe ser negativo, ej: -2):</label>
            <input type="number" [(ngModel)]="request.coeficienteA" name="coeficienteA" required>
          </div>

          <div class="grupo-campo">
            <label>Coeficiente B (Ej: 120):</label>
            <input type="number" [(ngModel)]="request.coeficienteB" name="coeficienteB" required>
          </div>

          <div class="grupo-campo">
            <label>Coeficiente C (Ej: -1000):</label>
            <input type="number" [(ngModel)]="request.coeficienteC" name="coeficienteC" required>
          </div>

          <div class="grupo-campo">
            <label>Precio Mínimo Permitido ($):</label>
            <input type="number" [(ngModel)]="request.precioMinimo" name="precioMinimo" required min="0">
          </div>

          <div class="grupo-campo">
            <label>Precio Máximo Permitido ($):</label>
            <input type="number" [(ngModel)]="request.precioMaximo" name="precioMaximo" required>
          </div>

          <button type="submit" [disabled]="!formOptimizador.valid || request.coeficienteA >= 0" class="btn-calcular">
            Calcular Precio Óptimo
          </button>
        </form>

        <div *ngIf="errorMensaje" class="alerta-error">
          {{ errorMensaje }}
        </div>
      </div>

      <div *ngIf="resultado" class="tarjeta-resultado">
        <h3>📊 Resultado del Análisis</h3>
        <div class="metrica">
          <span class="etiqueta">Precio Óptimo Sugerido:</span>
          <span class="valor">$ {{ resultado.precioOptimo }}</span>
        </div>
        <div class="metrica">
          <span class="etiqueta">Ganancia Máxima Estimada:</span>
          <span class="valor">$ {{ resultado.gananciaMaxima }}</span>
        </div>
        <div class="estrategia">
          <strong>Estrategia Recomendada:</strong>
          <p>{{ resultado.estrategiaSugerida }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contenedor-optimizador { display: flex; gap: 20px; max-width: 900px; margin: 20px auto; font-family: sans-serif; }
    .tarjeta-formulario, .tarjeta-resultado { background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); flex: 1; }
    h2, h3 { color: #1a365d; margin-top: 0; }
    .subtitulo { color: #718096; font-size: 14px; margin-bottom: 20px; }
    .grupo-campo { margin-bottom: 15px; display: flex; flex-direction: column; }
    label { font-size: 14px; margin-bottom: 5px; color: #4a5568; font-weight: bold; }
    input { padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 16px; }
    .btn-calcular { width: 100%; padding: 12px; background: #3182ce; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
    .btn-calcular:disabled { background: #cbd5e0; cursor: not-allowed; }
    .alerta-error { margin-top: 15px; padding: 10px; background: #fed7d7; color: #9b2c2c; border-radius: 4px; font-size: 14px; }
    .metrica { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
    .etiqueta { color: #4a5568; }
    .valor { font-weight: bold; color: #2f855a; font-size: 18px; }
    .estrategia { margin-top: 15px; background: #ebf8ff; padding: 15px; border-left: 4px solid #3182ce; border-radius: 0 4px 4px 0; }
  `]
})
export class OptimizadorComponent {
  // Valores por defecto iniciales limpios
  request: OptimizarPrecioRequest = {
    coeficienteA: -2,
    coeficienteB: 120,
    coeficienteC: -1000,
    precioMinimo: 10,
    precioMaximo: 100
  };

  resultado: OptimizarPrecioResponse | null = null;
  errorMensaje: string | null = null;

  // Inyectamos el servicio HTTP del frontend que creamos antes
  constructor(private readonly optimizadorService: OptimizadorFrontendService) {}

  enviarCalculo() {
    this.errorMensaje = null;

    // Consumimos el servicio asíncronamente con un subscribe estructurado
    this.optimizadorService.enviarCalculo(this.request).subscribe({
      next: (res) => {
        this.resultado = res;
      },
      error: (err) => {
        // Capturamos el BadRequestException del backend o fallos de red
        this.errorMensaje = err.error?.message || 'Error al conectar con el servidor matemático.';
      }
    });
  }
}
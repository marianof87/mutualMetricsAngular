import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css'
})
export class PricingComponent implements OnInit {
  // 1. Declaramos las propiedades que el HTML necesita leer
  form!: FormGroup;
  resultado: any = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // 2. Armamos la estructura de controles del formulario reactivo
    this.form = this.fb.group({
      coeficienteA: ['', [Validators.required]],
      coeficienteB: ['', [Validators.required]],
      coeficienteC: ['', [Validators.required]],
      precioMinimo: ['', [Validators.required]],
      precioMaximo: ['', [Validators.required]]
    });

    // Precarga desde re-ejecución de escenario (T1.7)
    const state = history.state as Record<string, unknown> | undefined;
    const inputs = state?.['inputs'] as Record<string, unknown> | undefined;
    if (inputs && typeof inputs === 'object') {
      const claves = ['coeficienteA', 'coeficienteB', 'coeficienteC', 'precioMinimo', 'precioMaximo'] as const;
      const parche: Record<string, number> = {};
      let tieneValidos = false;
      for (const clave of claves) {
        const valor = inputs[clave];
        if (typeof valor === 'number' && Number.isFinite(valor)) {
          parche[clave] = valor;
          tieneValidos = true;
        }
      }
      if (tieneValidos) {
        this.form.patchValue(parche);
      }
    }
  }

  // 3. La función que se ejecuta cuando el usuario le da al botón "Calcular"
  onSubmit(): void {
    if (this.form.invalid) return;

    // Hardcodeamos una respuesta de prueba para comprobar que los cables funcionen
    this.resultado = {
      precioOptimo: 45.2,
      gananciaMaxima: 230000.50,
      estrategiaSugerida: 'Estrategia Óptima de Temporada Alta (Simulada)'
    };
  }
}
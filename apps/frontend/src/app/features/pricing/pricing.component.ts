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
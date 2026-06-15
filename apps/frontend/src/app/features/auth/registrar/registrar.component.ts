import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistrarRequestSchema, type EnvelopeError } from '@mutual-metrics/shared';
import { SesionService } from '../../../core/servicios/sesion.service';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.css',
})
export class RegistrarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  enviar(): void {
    this.mensajeError.set(null);

    const parseado = RegistrarRequestSchema.safeParse(this.formulario.getRawValue());
    if (!parseado.success) {
      this.formulario.markAllAsTouched();
      this.mensajeError.set('Revisá los datos del formulario.');
      return;
    }

    this.enviando.set(true);
    this.sesion.registrar(parseado.data).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigate(['/']);
      },
      error: (envelope: EnvelopeError) => {
        this.enviando.set(false);
        this.mensajeError.set(envelope?.error?.message ?? 'No se pudo crear la cuenta.');
      },
    });
  }
}

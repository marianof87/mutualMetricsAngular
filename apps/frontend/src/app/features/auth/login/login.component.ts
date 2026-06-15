import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginRequestSchema, type EnvelopeError } from '@mutual-metrics/shared';
import { SesionService } from '../../../core/servicios/sesion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  enviar(): void {
    this.mensajeError.set(null);

    const parseado = LoginRequestSchema.safeParse(this.formulario.getRawValue());
    if (!parseado.success) {
      this.formulario.markAllAsTouched();
      this.mensajeError.set('Revisá los datos del formulario.');
      return;
    }

    this.enviando.set(true);
    this.sesion.iniciarSesion(parseado.data).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigate(['/']);
      },
      error: (envelope: EnvelopeError) => {
        this.enviando.set(false);
        this.mensajeError.set(envelope?.error?.message ?? 'No se pudo iniciar sesión.');
      },
    });
  }
}

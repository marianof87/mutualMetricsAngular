import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactoRequestSchema, EnvelopeError } from '@mutual-metrics/shared';
import { ContactoService } from './contacto.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css',
})
export class ContactoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(ContactoService);

  readonly enviando = signal(false);
  readonly mensajeExito = signal<string | null>(null);
  readonly mensajeError = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  enviar(): void {
    this.mensajeExito.set(null);
    this.mensajeError.set(null);

    const parseado = ContactoRequestSchema.safeParse(this.formulario.getRawValue());
    if (!parseado.success) {
      this.formulario.markAllAsTouched();
      this.mensajeError.set('Revisá los datos del formulario.');
      return;
    }

    this.enviando.set(true);
    this.servicio.enviar(parseado.data).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.mensajeExito.set(`Mensaje recibido (id ${respuesta.id}). Gracias por contactarnos.`);
        this.formulario.reset();
      },
      error: (envelope: EnvelopeError) => {
        this.enviando.set(false);
        this.mensajeError.set(envelope?.error?.message ?? 'No se pudo enviar el mensaje.');
      },
    });
  }
}

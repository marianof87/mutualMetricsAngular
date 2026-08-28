import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeadRequestSchema, type EnvelopeError, type LeadRequest } from '@mutual-metrics/shared';
import { LeadsService } from '../servicios/leads.service';

@Component({
  selector: 'app-modal-captura-lead',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './modal-captura-lead.component.html',
})
export class ModalCapturaLeadComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);

  readonly enviando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly registrado = output<LeadRequest>();
  readonly cerrado = output<void>();

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    empresa: ['', [Validators.required, Validators.maxLength(120)]],
    whatsapp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
  });

  enviar(): void {
    this.mensajeError.set(null);

    const parseado = LeadRequestSchema.safeParse(this.formulario.getRawValue());
    if (!parseado.success) {
      this.formulario.markAllAsTouched();
      this.mensajeError.set('Revisá los datos del formulario.');
      return;
    }

    this.enviando.set(true);
    this.leadsService.registrar(parseado.data).subscribe({
      next: () => {
        this.enviando.set(false);
        this.registrado.emit(parseado.data);
      },
      error: (envelope: EnvelopeError) => {
        this.enviando.set(false);
        this.mensajeError.set(envelope?.error?.message ?? 'No se pudo registrar tu contacto.');
      },
    });
  }

  cerrar(): void {
    if (!this.enviando()) {
      this.cerrado.emit();
    }
  }
}

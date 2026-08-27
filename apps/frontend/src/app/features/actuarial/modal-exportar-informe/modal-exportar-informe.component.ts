import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LeadRequestSchema,
  type EnvelopeError,
  type LeadRequest,
  type LeadResponse,
} from '@mutual-metrics/shared';
import { ActuarialService } from '../actuarial.service';

export interface InformeExportado {
  lead: LeadRequest;
  leadId: string;
}

@Component({
  selector: 'app-modal-exportar-informe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './modal-exportar-informe.component.html',
  styleUrl: './modal-exportar-informe.component.css',
})
export class ModalExportarInformeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(ActuarialService);

  readonly enviando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  readonly exportado = output<InformeExportado>();
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
    this.servicio.registrarLead(parseado.data).subscribe({
      next: (respuesta: LeadResponse) => {
        this.enviando.set(false);
        this.exportado.emit({ lead: parseado.data, leadId: respuesta.id });
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
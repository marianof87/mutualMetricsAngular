import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeadRequestSchema, type LeadRequest } from '@mutual-metrics/shared';

@Component({
  selector: 'app-modal-exportar-informe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './modal-exportar-informe.component.html',
})
export class ModalExportarInformeComponent {
  private readonly fb = inject(FormBuilder);

  readonly mensajeError = signal<string | null>(null);

  readonly exportado = output<LeadRequest>();
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

    this.exportado.emit(parseado.data);
  }

  cerrar(): void {
    this.cerrado.emit();
  }
}
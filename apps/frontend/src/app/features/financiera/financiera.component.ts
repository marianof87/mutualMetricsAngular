import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  calcularInteresSimple, 
  calcularInteresCompuesto, 
  calcularROI, 
  calcularVAN, 
  calcularTIR 
} from '@mutual-metrics/shared';

type CalculadoraTipo = 'interes-simple' | 'interes-compuesto' | 'roi' | 'van-tir';

@Component({
  selector: 'app-financiera',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './financiera.component.html',
  styleUrl: './financiera.component.css'
})
export class FinancieraComponent {
  tipoActivo = signal<CalculadoraTipo>('interes-simple');

  // Interés Simple
  isPrincipal = signal<number>(1000);
  isTasa = signal<number>(5);
  isTiempo = signal<number>(1);
  isResultado = computed(() => {
    return calcularInteresSimple(this.isPrincipal(), this.isTasa() / 100, this.isTiempo());
  });

  // Interés Compuesto
  icPrincipal = signal<number>(1000);
  icTasa = signal<number>(5);
  icTiempo = signal<number>(1);
  icFrecuencia = signal<number>(12); // Mensual por defecto
  icResultado = computed(() => {
    return calcularInteresCompuesto(this.icPrincipal(), this.icTasa() / 100, this.icTiempo(), this.icFrecuencia());
  });

  // ROI
  roiInversion = signal<number>(1000);
  roiBeneficio = signal<number>(1500);
  roiResultado = computed(() => {
    return calcularROI(this.roiInversion(), this.roiBeneficio());
  });

  // VAN / TIR
  vtTasa = signal<number>(10);
  vtInversion = signal<number>(-1000);
  vtFlujosStr = signal<string>("500, 700, 300");
  vtFlujos = computed(() => {
    return this.vtFlujosStr().split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  });

  vtVan = computed(() => {
    return calcularVAN(this.vtTasa() / 100, this.vtInversion(), this.vtFlujos());
  });

  vtTir = computed(() => {
    return calcularTIR(this.vtInversion(), this.vtFlujos());
  });

  setTipo(tipo: CalculadoraTipo) {
    this.tipoActivo.set(tipo);
  }
}

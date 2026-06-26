import { Injectable } from '@nestjs/common';
import { 
  calcularInteresSimple, 
  calcularInteresCompuesto, 
  calcularROI, 
  calcularVAN, 
  calcularTIR,
  InteresSimpleRequest,
  InteresCompuestoRequest,
  ROIRequest,
  VANRequest,
  TIRRequest
} from '@mutual-metrics/shared';

@Injectable()
export class FinanzasService {
  
  interesSimple(dto: InteresSimpleRequest) {
    return calcularInteresSimple(dto.principal, dto.tasa, dto.tiempo);
  }

  interesCompuesto(dto: InteresCompuestoRequest) {
    return calcularInteresCompuesto(dto.principal, dto.tasa, dto.tiempo, dto.frecuencia);
  }

  roi(dto: ROIRequest) {
    return { roi: calcularROI(dto.inversion, dto.beneficio) };
  }

  van(dto: VANRequest) {
    return { van: calcularVAN(dto.tasa, dto.inversionInicial, dto.flujos) };
  }

  tir(dto: TIRRequest) {
    return { tir: calcularTIR(dto.inversionInicial, dto.flujos) };
  }
}

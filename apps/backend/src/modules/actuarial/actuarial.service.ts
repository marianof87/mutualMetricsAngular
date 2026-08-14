import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CodigoError,
  SimulacionActuarialRequest,
  SimulacionActuarialResponse,
  simularRiesgo,
} from '@mutual-metrics/shared';

@Injectable()
export class ActuarialService {
  /**
   * Orquesta la simulación actuarial sin duplicar la matemática: la delega al
   * dominio puro de @mutual-metrics/shared. Acá vive solo la protección de
   * negocio (la incertidumbre es condición de existencia del módulo).
   */
  simularRiesgo(solicitud: SimulacionActuarialRequest): SimulacionActuarialResponse {
    if (
      solicitud.coeficienteA.tipo === 'fijo' &&
      solicitud.coeficienteC.tipo === 'fijo'
    ) {
      throw new BadRequestException({
        code: CodigoError.SIMULACION_SIN_INCERTIDUMBRE,
        message: 'Al menos un coeficiente debe ser estocástico para simular riesgo.',
      });
    }
    return simularRiesgo(solicitud);
  }
}
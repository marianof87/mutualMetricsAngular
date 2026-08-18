import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  CodigoError,
  SimulacionActuarialRequest,
  SimulacionActuarialResponse,
  simularRiesgo,
  tieneIncertidumbre,
} from '@mutual-metrics/shared';

@Injectable()
export class ActuarialService {
  /**
   * Orquesta la simulación actuarial sin duplicar la matemática: la delega al
   * dominio puro de @mutual-metrics/shared. Acá vive solo la protección de
   * negocio (la incertidumbre es condición de existencia del módulo) y la
   * traducción de errores matemáticos del dominio al envelope del proyecto.
   */
  simularRiesgo(solicitud: SimulacionActuarialRequest): SimulacionActuarialResponse {
    if (!tieneIncertidumbre(solicitud)) {
      throw new BadRequestException({
        code: CodigoError.SIMULACION_SIN_INCERTIDUMBRE,
        message: 'Al menos un coeficiente debe ser estocástico para simular riesgo.',
      });
    }
    try {
      return simularRiesgo(solicitud);
    } catch (error) {
      return traducirErrorDominio(error);
    }
  }
}

/**
 * Traduce errores matemáticos del dominio al envelope del proyecto: un
 * RangeError del motor se devuelve como 422 ENTRADA_INVALIDA; cualquier otra
 * excepción se re-lanza para que la maneje el filtro global.
 */
export function traducirErrorDominio(error: unknown): never {
  if (error instanceof RangeError) {
    throw new UnprocessableEntityException({
      code: CodigoError.ENTRADA_INVALIDA,
      message: error.message,
    });
  }
  throw error;
}
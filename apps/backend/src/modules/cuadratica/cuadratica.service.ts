import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CodigoError, resolverCuadratica } from '@mutual-metrics/shared';
import type { CuadraticaRequest, CuadraticaResponse } from '@mutual-metrics/shared';

// Traduce los errores del dominio puro al envelope estándar del backend.
// El dominio lanza `Error(CodigoError.CUADRATICA_A_CERO)` cuando a === 0;
// aquí se convierte en 422 con el código documentado en contracts/openapi.yaml.
@Injectable()
export class CuadraticaService {
  resolver(dto: CuadraticaRequest): CuadraticaResponse {
    try {
      return resolverCuadratica(dto.a, dto.b, dto.c);
    } catch (error) {
      if (error instanceof Error && error.message === CodigoError.CUADRATICA_A_CERO) {
        throw new UnprocessableEntityException({
          code: CodigoError.CUADRATICA_A_CERO,
          message: 'El coeficiente a no puede ser 0: la ecuación es lineal, no cuadrática',
        });
      }
      throw error;
    }
  }
}

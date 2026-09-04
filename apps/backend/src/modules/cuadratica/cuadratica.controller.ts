import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CuadraticaRequestSchema } from '@mutual-metrics/shared';
import type { CuadraticaRequest, CuadraticaResponse } from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { CuadraticaService } from './cuadratica.service';

// Dueño: @marianof87 (Slice 2)
// Endpoint: POST /cuadratica/resolver — recibe { a, b, c } y devuelve discriminante, raíces y vértice.
// Lógica matemática: vive en packages/shared/src/dominio/cuadratica/ (pura, testeable).
@Controller('cuadratica')
export class CuadraticaController {
  constructor(private readonly servicio: CuadraticaService) {}

  @Post('resolver')
  @HttpCode(200)
  resolver(
    @Body(new ZodValidationPipe(CuadraticaRequestSchema)) dto: CuadraticaRequest,
  ): CuadraticaResponse {
    return this.servicio.resolver(dto);
  }
}

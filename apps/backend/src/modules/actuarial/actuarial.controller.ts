import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  SimulacionActuarialRequest,
  SimulacionActuarialRequestSchema,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { ActuarialService } from './actuarial.service';

// Dueño: @marianof87 (Slice 2 — módulo actuarial de Metrix AI).
// POST /api/v1/actuarial/simulaciones — Monte Carlo sobre G(P) = AP² + BP + C.
// La matemática vive en packages/shared/src/dominio/actuarial/ (pura, testeable).
@Controller('actuarial')
export class ActuarialController {
  constructor(private readonly servicio: ActuarialService) {}

  @Post('simulaciones')
  @HttpCode(200)
  simular(
    @Body(new ZodValidationPipe(SimulacionActuarialRequestSchema))
    solicitud: SimulacionActuarialRequest,
  ): SimulacionActuarialResponse {
    return this.servicio.simularRiesgo(solicitud);
  }
}
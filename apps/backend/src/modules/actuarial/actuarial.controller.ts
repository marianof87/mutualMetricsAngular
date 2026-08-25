import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  GuardarSimulacionActuarial,
  GuardarSimulacionActuarialSchema,
  SimulacionActuarialRequest,
  SimulacionActuarialRequestSchema,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { ActuarialService } from './actuarial.service';
import { ActuarialPersistenciaService } from './actuarial-persistencia.service';

// Dueño: @marianof87 (Slice 2 — módulo actuarial de Metrix AI).
// POST /api/v1/actuarial/simulaciones — Monte Carlo sobre G(P) = AP² + BP + C.
// POST /api/v1/actuarial/simulaciones/guardar — persiste resumen de corrida.
@Controller('actuarial')
export class ActuarialController {
  constructor(
    private readonly servicio: ActuarialService,
    private readonly persistencia: ActuarialPersistenciaService,
  ) {}

  @Post('simulaciones')
  @HttpCode(200)
  async simular(
    @Body(new ZodValidationPipe(SimulacionActuarialRequestSchema))
    solicitud: SimulacionActuarialRequest,
  ): Promise<SimulacionActuarialResponse> {
    return await this.servicio.simularRiesgo(solicitud);
  }

  @Post('simulaciones/guardar')
  @HttpCode(201)
  async guardar(
    @Body(new ZodValidationPipe(GuardarSimulacionActuarialSchema))
    datos: GuardarSimulacionActuarial,
  ): Promise<{ id: string }> {
    return await this.persistencia.guardarDesdeResumen(datos);
  }
}
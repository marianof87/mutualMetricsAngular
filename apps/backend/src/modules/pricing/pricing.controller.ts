import { Controller, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';

// Dueño: @Monzon1983 (Slice 3)
// Endpoints esperados: POST /pricing/optimizar, POST /pricing/break-even.
// Lógica de optimización: debe vivir en packages/shared/src/dominio/pricing/.
@Controller('pricing')
export class PricingController {
  constructor(private readonly servicio: PricingService) {}

  @Post('ping')
  ping() {
    return this.servicio.ping();
  }
}

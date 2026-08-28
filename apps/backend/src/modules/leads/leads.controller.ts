import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LeadRequest, LeadRequestSchema, LeadResponse } from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly servicio: LeadsService) {}

  @Post()
  @HttpCode(201)
  async registrar(
    @Body(new ZodValidationPipe(LeadRequestSchema)) dto: LeadRequest,
  ): Promise<LeadResponse> {
    return await this.servicio.registrar(dto);
  }
}

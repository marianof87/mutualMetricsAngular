import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { FinanzasService } from './finanzas.service';
import {
  InteresSimpleRequest,
  InteresSimpleRequestSchema,
  InteresCompuestoRequest,
  InteresCompuestoRequestSchema,
  ROIRequest,
  ROIRequestSchema,
  VANRequest,
  VANRequestSchema,
  TIRRequest,
  TIRRequestSchema,
} from '@mutual-metrics/shared';

@Controller('finanzas')
export class FinanzasController {
  constructor(private readonly finanzasService: FinanzasService) {}

  @Post('interes-simple')
  @HttpCode(201)
  interesSimple(@Body(new ZodValidationPipe(InteresSimpleRequestSchema)) dto: InteresSimpleRequest) {
    return this.finanzasService.interesSimple(dto);
  }

  @Post('interes-compuesto')
  @HttpCode(201)
  interesCompuesto(@Body(new ZodValidationPipe(InteresCompuestoRequestSchema)) dto: InteresCompuestoRequest) {
    return this.finanzasService.interesCompuesto(dto);
  }

  @Post('roi')
  @HttpCode(201)
  roi(@Body(new ZodValidationPipe(ROIRequestSchema)) dto: ROIRequest) {
    return this.finanzasService.roi(dto);
  }

  @Post('van')
  @HttpCode(201)
  van(@Body(new ZodValidationPipe(VANRequestSchema)) dto: VANRequest) {
    return this.finanzasService.van(dto);
  }

  @Post('tir')
  @HttpCode(201)
  tir(@Body(new ZodValidationPipe(TIRRequestSchema)) dto: TIRRequest) {
    return this.finanzasService.tir(dto);
  }
}

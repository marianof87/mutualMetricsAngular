import { Controller, Post, Body } from '@nestjs/common';
import { FinanzasService } from './finanzas.service';
import { 
  InteresSimpleRequest, 
  InteresCompuestoRequest, 
  ROIRequest, 
  VANRequest, 
  TIRRequest 
} from '@mutual-metrics/shared';

@Controller('finanzas')
export class FinanzasController {
  constructor(private readonly finanzasService: FinanzasService) {}

  @Post('interes-simple')
  interesSimple(@Body() dto: InteresSimpleRequest) {
    return this.finanzasService.interesSimple(dto);
  }

  @Post('interes-compuesto')
  interesCompuesto(@Body() dto: InteresCompuestoRequest) {
    return this.finanzasService.interesCompuesto(dto);
  }

  @Post('roi')
  roi(@Body() dto: ROIRequest) {
    return this.finanzasService.roi(dto);
  }

  @Post('van')
  van(@Body() dto: VANRequest) {
    return this.finanzasService.van(dto);
  }

  @Post('tir')
  tir(@Body() dto: TIRRequest) {
    return this.finanzasService.tir(dto);
  }
}

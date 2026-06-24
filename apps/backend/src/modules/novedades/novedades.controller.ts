import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CrearNovedadRequest,
  CrearNovedadSchema,
  NovedadResponse,
  Paginado,
  ParametrosPaginacionSchema,
} from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { NovedadesService } from './novedades.service';

@Controller('novedades')
export class NovedadesController {
  constructor(private readonly servicio: NovedadesService) {}

  @Get()
  listar(
    @Query(new ZodValidationPipe(ParametrosPaginacionSchema))
    params: { page: number; tamano: number },
  ): Promise<Paginado<NovedadResponse>> {
    return this.servicio.listar(params.page, params.tamano);
  }

  @Post()
  crear(
    @Body(new ZodValidationPipe(CrearNovedadSchema)) dto: CrearNovedadRequest,
  ): Promise<NovedadResponse> {
    return this.servicio.crear(dto);
  }
}

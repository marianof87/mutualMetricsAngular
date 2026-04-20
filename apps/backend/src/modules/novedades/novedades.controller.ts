import { Controller, Get } from '@nestjs/common';
import { NovedadesService } from './novedades.service';

@Controller('novedades')
export class NovedadesController {
  constructor(private readonly servicio: NovedadesService) {}

  @Get()
  listar() {
    return this.servicio.listar();
  }
}

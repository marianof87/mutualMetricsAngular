import { Controller, Get } from '@nestjs/common';
import { ServiciosService } from './servicios.service';

@Controller('servicios')
export class ServiciosController {
  constructor(private readonly servicio: ServiciosService) {}

  @Get()
  listar() {
    return this.servicio.listar();
  }
}

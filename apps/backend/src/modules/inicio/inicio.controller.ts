import { Controller, Get } from '@nestjs/common';
import { InicioService } from './inicio.service';

@Controller('inicio')
export class InicioController {
  constructor(private readonly servicio: InicioService) {}

  @Get('saludo')
  saludo() {
    return this.servicio.saludo();
  }
}

import { Controller, Get } from '@nestjs/common';
import { SobreNosotrosService } from './sobre-nosotros.service';

@Controller('sobre-nosotros')
export class SobreNosotrosController {
  constructor(private readonly servicio: SobreNosotrosService) {}

  @Get()
  obtenerInfo() {
    return this.servicio.obtenerInfo();
  }
}

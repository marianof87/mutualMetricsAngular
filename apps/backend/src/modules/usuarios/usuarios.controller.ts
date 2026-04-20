import { Controller, Get } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

// Dueño: @Nubiru (Slice 1)
// Endpoints esperados: GET /usuarios/yo, PATCH /usuarios/yo, GET /usuarios/:id (admin).
// Protegidos por JwtAuthGuard una vez que Auth esté listo.
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly servicio: UsuariosService) {}

  @Get('ping')
  ping() {
    return this.servicio.ping();
  }
}

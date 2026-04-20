import { Controller, Get } from '@nestjs/common';
import { EscenariosService } from './escenarios.service';

// Dueño: @Franco1212 (Slice 4)
// Endpoints esperados: POST /escenarios, GET /escenarios (paginado), GET /escenarios/:id, DELETE /escenarios/:id.
// Todos los endpoints protegidos por JwtAuthGuard (scope al usuarioId del token).
@Controller('escenarios')
export class EscenariosController {
  constructor(private readonly servicio: EscenariosService) {}

  @Get('ping')
  ping() {
    return this.servicio.ping();
  }
}

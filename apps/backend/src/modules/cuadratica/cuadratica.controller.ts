import { Controller, Post } from '@nestjs/common';
import { CuadraticaService } from './cuadratica.service';

// Dueño: @marianof87 (Slice 2)
// Endpoint esperado: POST /cuadratica/resolver — recibe { a, b, c } y devuelve discriminante, raíces y vértice.
// Lógica matemática: debe vivir en packages/shared/src/dominio/cuadratica/ (pura, testeable).
@Controller('cuadratica')
export class CuadraticaController {
  constructor(private readonly servicio: CuadraticaService) {}

  @Post('ping')
  ping() {
    return this.servicio.ping();
  }
}

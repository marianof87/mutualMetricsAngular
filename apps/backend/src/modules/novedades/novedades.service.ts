import { Injectable } from '@nestjs/common';

@Injectable()
export class NovedadesService {
  listar(): { novedades: unknown[] } {
    return { novedades: [] };
  }
}

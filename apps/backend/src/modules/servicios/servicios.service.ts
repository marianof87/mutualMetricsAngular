import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiciosService {
  listar(): { servicios: string[] } {
    return { servicios: [] };
  }
}

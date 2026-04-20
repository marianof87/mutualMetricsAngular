import { Injectable } from '@nestjs/common';

@Injectable()
export class InicioService {
  saludo(): { mensaje: string } {
    return { mensaje: 'Bienvenido a MutualMetrics' };
  }
}

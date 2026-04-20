import { Injectable } from '@nestjs/common';

@Injectable()
export class CuadraticaService {
  ping(): { ok: boolean } {
    return { ok: true };
  }
}

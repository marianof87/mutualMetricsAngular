import { Injectable } from '@nestjs/common';

@Injectable()
export class UsuariosService {
  ping(): { ok: boolean } {
    return { ok: true };
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class EscenariosService {
  ping(): { ok: boolean } {
    return { ok: true };
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  ping(): { ok: boolean } {
    return { ok: true };
  }
}

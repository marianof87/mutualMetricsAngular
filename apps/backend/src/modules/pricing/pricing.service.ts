import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  ping(): { ok: boolean } {
    return { ok: true };
  }
}

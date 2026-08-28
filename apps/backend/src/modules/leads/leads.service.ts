import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import type { LeadRequest, LeadResponse } from '@mutual-metrics/shared';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(dto: LeadRequest): Promise<LeadResponse> {
    const lead = await this.prisma.lead.create({
      data: {
        nombre: dto.nombre,
        empresa: dto.empresa,
        whatsapp: dto.whatsapp,
        email: dto.email,
      },
    });

    this.logger.log(`Lead registrado: id=${lead.id} email=${dto.email}`);
    return {
      id: lead.id,
      recibidoEn: lead.recibidoEn.toISOString(),
    };
  }
}

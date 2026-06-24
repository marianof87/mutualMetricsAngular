import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import type { ContactoRequest, ContactoResponse } from '@mutual-metrics/shared';

@Injectable()
export class ContactoService {
  private readonly logger = new Logger(ContactoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(dto: ContactoRequest): Promise<ContactoResponse> {
    const contacto = await this.prisma.contacto.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        mensaje: dto.mensaje,
      },
    });

    this.logger.log(`Contacto recibido: id=${contacto.id} email=${dto.email}`);
    return {
      id: contacto.id,
      recibidoEn: contacto.recibidoEn.toISOString(),
    };
  }
}

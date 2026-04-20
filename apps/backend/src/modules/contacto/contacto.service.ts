import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ContactoRequest, ContactoResponse } from '@mutual-metrics/shared';

@Injectable()
export class ContactoService {
  private readonly logger = new Logger(ContactoService.name);

  registrar(dto: ContactoRequest): ContactoResponse {
    const respuesta: ContactoResponse = {
      id: randomUUID(),
      recibidoEn: new Date().toISOString(),
    };
    this.logger.log(`Contacto recibido: id=${respuesta.id} email=${dto.email}`);
    return respuesta;
  }
}

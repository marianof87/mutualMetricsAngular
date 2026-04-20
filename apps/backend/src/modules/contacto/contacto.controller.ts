import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ContactoRequest,
  ContactoRequestSchema,
  ContactoResponse,
} from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { ContactoService } from './contacto.service';

@Controller('contactos')
export class ContactoController {
  constructor(private readonly servicio: ContactoService) {}

  @Post()
  @HttpCode(201)
  enviar(
    @Body(new ZodValidationPipe(ContactoRequestSchema)) dto: ContactoRequest,
  ): ContactoResponse {
    return this.servicio.registrar(dto);
  }
}

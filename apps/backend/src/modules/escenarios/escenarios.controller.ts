import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  EscenarioCreateRequest,
  EscenarioResponse,
  Paginado,
  ParametrosListadoEscenarios,
} from '@mutual-metrics/shared';
import { EscenarioCreateSchema, ParametrosListadoEscenariosSchema } from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { JwtAuthGuard, type UsuarioJwt } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorador';
import { EscenariosService } from './escenarios.service';

// Dueño: @Franco1212 (Slice 4 - Historial).
// Todos los endpoints scoped al usuarioId del JWT: si el escenario es de otro
// usuario (o inexistente) el service responde 404 sin filtrar acceso.
@Controller('escenarios')
@UseGuards(JwtAuthGuard)
export class EscenariosController {
  constructor(private readonly servicio: EscenariosService) {}

  @Get()
  listar(
    @UsuarioActual() usuario: UsuarioJwt,
    @Query(new ZodValidationPipe(ParametrosListadoEscenariosSchema)) params: ParametrosListadoEscenarios,
  ): Promise<Paginado<EscenarioResponse>> {
    return this.servicio.listar(usuario.sub, params.page, params.tamano, params.tipo);
  }

  @Post()
  @HttpCode(201)
  crear(
    @UsuarioActual() usuario: UsuarioJwt,
    @Body(new ZodValidationPipe(EscenarioCreateSchema)) dto: EscenarioCreateRequest,
  ): Promise<EscenarioResponse> {
    return this.servicio.crear(usuario.sub, dto);
  }

  @Get(':id')
  obtener(
    @UsuarioActual() usuario: UsuarioJwt,
    @Param('id') id: string,
  ): Promise<EscenarioResponse> {
    return this.servicio.obtenerPorId(usuario.sub, id);
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminar(
    @UsuarioActual() usuario: UsuarioJwt,
    @Param('id') id: string,
  ): Promise<void> {
    await this.servicio.eliminar(usuario.sub, id);
  }
}

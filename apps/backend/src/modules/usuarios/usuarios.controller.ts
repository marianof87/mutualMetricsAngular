import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  type Usuario,
  type UsuarioActualizar,
  UsuarioActualizarSchema,
} from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { JwtAuthGuard, type UsuarioJwt } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorador';
import { UsuariosService } from './usuarios.service';

// Dueño: @Nubiru (Slice 1). Perfil del usuario autenticado (scoped al JWT).
@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly servicio: UsuariosService) {}

  @Get('yo')
  yo(@UsuarioActual() usuario: UsuarioJwt): Promise<Usuario> {
    return this.servicio.obtenerPorId(usuario.sub);
  }

  @Patch('yo')
  actualizar(
    @UsuarioActual() usuario: UsuarioJwt,
    @Body(new ZodValidationPipe(UsuarioActualizarSchema)) dto: UsuarioActualizar,
  ): Promise<Usuario> {
    return this.servicio.actualizar(usuario.sub, dto);
  }
}

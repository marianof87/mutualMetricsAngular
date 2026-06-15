import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CodigoError,
  type Usuario,
  type UsuarioActualizar,
} from '@mutual-metrics/shared';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPorId(id: string): Promise<Usuario> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException({
        code: CodigoError.RECURSO_NO_ENCONTRADO,
        message: 'Usuario no encontrado',
      });
    }
    return this.aPublico(usuario);
  }

  async actualizar(id: string, dto: UsuarioActualizar): Promise<Usuario> {
    await this.obtenerPorId(id);
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { nombre: dto.nombre },
    });
    return this.aPublico(usuario);
  }

  private aPublico(usuario: { id: string; email: string; nombre: string }): Usuario {
    return { id: usuario.id, email: usuario.email, nombre: usuario.nombre };
  }
}

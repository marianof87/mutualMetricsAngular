import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestConUsuario, UsuarioJwt } from './jwt-auth.guard';

// Extrae el usuario que JwtAuthGuard dejó en la request.
// Uso: `metodo(@UsuarioActual() usuario: UsuarioJwt) {}`
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioJwt => {
    const request = ctx.switchToHttp().getRequest<RequestConUsuario>();
    // Garantizado por JwtAuthGuard; el `!` documenta esa precondición.
    return request.usuario!;
  },
);

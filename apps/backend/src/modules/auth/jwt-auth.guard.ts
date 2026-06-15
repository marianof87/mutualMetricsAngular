import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { CodigoError } from '@mutual-metrics/shared';

// Payload que firmamos al crear la sesión (ver AuthService.crearSesion).
export interface UsuarioJwt {
  sub: string;
  email: string;
}

export type RequestConUsuario = Request & { usuario?: UsuarioJwt };

const PREFIJO_BEARER = 'Bearer ';

// Protege endpoints que requieren un usuario autenticado. Otros slices lo
// reutilizan vía `@UseGuards(JwtAuthGuard)` importando AuthModule.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const header = request.headers.authorization;

    if (!header?.startsWith(PREFIJO_BEARER)) {
      throw new UnauthorizedException({
        code: CodigoError.AUTH_TOKEN_INVALIDO,
        message: 'Falta el token de autenticación',
      });
    }

    const token = header.slice(PREFIJO_BEARER.length);
    try {
      request.usuario = this.jwt.verify<UsuarioJwt>(token);
      return true;
    } catch (error) {
      const expirado = error instanceof Error && error.name === 'TokenExpiredError';
      throw new UnauthorizedException({
        code: expirado ? CodigoError.AUTH_TOKEN_EXPIRADO : CodigoError.AUTH_TOKEN_INVALIDO,
        message: expirado ? 'El token expiró' : 'Token de autenticación inválido',
      });
    }
  }
}

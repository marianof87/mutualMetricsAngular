import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  CodigoError,
  type LoginRequest,
  type RegistrarRequest,
  type SesionResponse,
  type Usuario,
} from '@mutual-metrics/shared';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

const RONDAS_SALT = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrar(dto: RegistrarRequest): Promise<SesionResponse> {
    const yaExiste = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (yaExiste) {
      throw new ConflictException({
        code: CodigoError.AUTH_EMAIL_YA_REGISTRADO,
        message: 'Ya existe una cuenta con ese email',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, RONDAS_SALT);
    const usuario = await this.prisma.usuario.create({
      data: { email: dto.email, passwordHash, nombre: dto.nombre },
    });

    return this.crearSesion(usuario);
  }

  async login(dto: LoginRequest): Promise<SesionResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    // Mismo error para email inexistente y password incorrecta: no revelar cuál falló.
    const coincide =
      usuario !== null && (await bcrypt.compare(dto.password, usuario.passwordHash));
    if (!usuario || !coincide) {
      throw new UnauthorizedException({
        code: CodigoError.AUTH_CREDENCIALES_INVALIDAS,
        message: 'Email o contraseña incorrectos',
      });
    }

    return this.crearSesion(usuario);
  }

  private crearSesion(usuario: {
    id: string;
    email: string;
    nombre: string;
  }): SesionResponse {
    const accessToken = this.jwt.sign({ sub: usuario.id, email: usuario.email });
    const publico: Usuario = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    };
    return { accessToken, usuario: publico };
  }
}

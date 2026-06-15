import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  type LoginRequest,
  LoginRequestSchema,
  type RegistrarRequest,
  RegistrarRequestSchema,
  type SesionResponse,
} from '@mutual-metrics/shared';
import { ZodValidationPipe } from '../../comunes/pipes/zod.pipe';
import { AuthService } from './auth.service';

// Dueño: @Nubiru (Slice 1). Endpoints: POST /auth/registrar, POST /auth/login.
@Controller('auth')
export class AuthController {
  constructor(private readonly servicio: AuthService) {}

  @Post('registrar')
  @HttpCode(201)
  registrar(
    @Body(new ZodValidationPipe(RegistrarRequestSchema)) dto: RegistrarRequest,
  ): Promise<SesionResponse> {
    return this.servicio.registrar(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) dto: LoginRequest,
  ): Promise<SesionResponse> {
    return this.servicio.login(dto);
  }
}

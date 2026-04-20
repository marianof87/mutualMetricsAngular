import { Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

// Dueño: @Nubiru (Slice 1)
// Endpoints esperados: POST /auth/registrar, POST /auth/login, POST /auth/refresh.
// Pendiente de implementación con JWT + bcrypt + schemas compartidos.
@Controller('auth')
export class AuthController {
  constructor(private readonly servicio: AuthService) {}

  @Post('ping')
  @HttpCode(200)
  ping() {
    return this.servicio.ping();
  }
}

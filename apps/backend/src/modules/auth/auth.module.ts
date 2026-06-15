import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

// Vida del access token. Fijo para el MVP (mantener simple).
const EXPIRACION_TOKEN = '1d';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: EXPIRACION_TOKEN },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // Exporta JwtModule + el guard para que otros slices protejan sus endpoints.
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EscenariosController } from './escenarios.controller';
import { EscenariosService } from './escenarios.service';

@Module({
  // AuthModule provee JwtAuthGuard/JwtService y @UsuarioActual para este módulo.
  imports: [AuthModule],
  controllers: [EscenariosController],
  providers: [EscenariosService],
})
export class EscenariosModule {}

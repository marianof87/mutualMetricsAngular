import { Module } from '@nestjs/common';
import { CuadraticaController } from './cuadratica.controller';
import { CuadraticaService } from './cuadratica.service';

@Module({
  controllers: [CuadraticaController],
  providers: [CuadraticaService],
})
export class CuadraticaModule {}

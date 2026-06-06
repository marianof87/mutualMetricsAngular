import { Module } from '@nestjs/common';
import { OptimizadorController } from './optimizador.controller';
import { OptimizadorService } from './optimizador.service';

@Module({
  controllers: [OptimizadorController],
  providers: [OptimizadorService],
})
export class OptimizadorModule {}
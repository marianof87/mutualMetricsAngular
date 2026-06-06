import { Module } from '@nestjs/common';
import { OptimizadorController } from './optimizador.controller';
import { OptimizadorService } from './optimizador.service';
import { PersistenciaModule } from '../../comunes/persistencia/persistencia.module'; // Importamos el módulo de base de datos

@Module({
  imports: [PersistenciaModule], // Inyectamos la persistencia para que el servicio tenga acceso a Prisma
  controllers: [OptimizadorController],
  providers: [OptimizadorService],
})
export class OptimizadorModule {}
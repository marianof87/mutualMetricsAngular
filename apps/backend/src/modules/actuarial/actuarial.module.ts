import { Module } from '@nestjs/common';
import { ActuarialController } from './actuarial.controller';
import { ActuarialService } from './actuarial.service';
import { ActuarialPersistenciaService } from './actuarial-persistencia.service';

@Module({
  controllers: [ActuarialController],
  providers: [ActuarialService, ActuarialPersistenciaService],
  exports: [ActuarialPersistenciaService],
})
export class ActuarialModule {}
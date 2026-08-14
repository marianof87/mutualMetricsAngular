import { Module } from '@nestjs/common';
import { ActuarialController } from './actuarial.controller';
import { ActuarialService } from './actuarial.service';

@Module({
  controllers: [ActuarialController],
  providers: [ActuarialService],
})
export class ActuarialModule {}
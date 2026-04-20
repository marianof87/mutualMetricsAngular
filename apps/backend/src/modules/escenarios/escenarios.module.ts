import { Module } from '@nestjs/common';
import { EscenariosController } from './escenarios.controller';
import { EscenariosService } from './escenarios.service';

@Module({
  controllers: [EscenariosController],
  providers: [EscenariosService],
})
export class EscenariosModule {}

import { Module } from '@nestjs/common';
import { SobreNosotrosController } from './sobre-nosotros.controller';
import { SobreNosotrosService } from './sobre-nosotros.service';

@Module({
  controllers: [SobreNosotrosController],
  providers: [SobreNosotrosService],
})
export class SobreNosotrosModule {}

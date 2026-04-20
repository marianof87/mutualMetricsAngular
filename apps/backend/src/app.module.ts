import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenciaModule } from './comunes/persistencia/persistencia.module';
import { InicioModule } from './modules/inicio/inicio.module';
import { SobreNosotrosModule } from './modules/sobre-nosotros/sobre-nosotros.module';
import { ServiciosModule } from './modules/servicios/servicios.module';
import { NovedadesModule } from './modules/novedades/novedades.module';
import { ContactoModule } from './modules/contacto/contacto.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PersistenciaModule,
    InicioModule,
    SobreNosotrosModule,
    ServiciosModule,
    NovedadesModule,
    ContactoModule,
  ],
})
export class AppModule {}

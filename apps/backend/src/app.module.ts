import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PersistenciaModule } from './comunes/persistencia/persistencia.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CuadraticaModule } from './modules/cuadratica/cuadratica.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { EscenariosModule } from './modules/escenarios/escenarios.module';
import { NovedadesModule } from './modules/novedades/novedades.module';
import { ContactoModule } from './modules/contacto/contacto.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PersistenciaModule,
    AuthModule,
    UsuariosModule,
    CuadraticaModule,
    PricingModule,
    EscenariosModule,
    NovedadesModule,
    ContactoModule,
  ],
})
export class AppModule {}

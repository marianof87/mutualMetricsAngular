import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { FiltroExcepcionesGlobal } from './comunes/filtros/filtro-excepciones.filtro';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new FiltroExcepcionesGlobal());

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:4200'],
    credentials: true,
  });

  const puerto = Number(process.env.PORT ?? 3000);
  await app.listen(puerto);
  console.log(`Backend Metrix IA escuchando en http://localhost:${puerto}/api/v1`);
}

bootstrap();

import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { OptimizadorService } from './optimizador.service';
import { OptimizarPrecioRequest } from '@mutual-metrics/shared';

@Controller('optimizador')
export class OptimizadorController {
  constructor(private readonly optimizadorService: OptimizadorService) {}

  @Post('calcular')
  calcularOptimizacion(@Body() datos: OptimizarPrecioRequest) {
    return this.optimizadorService.optimizar(datos);
  }
}
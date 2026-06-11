import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { OptimizadorService } from './optimizador.service';
import { OptimizarPrecioRequest, OptimizarPrecioResponse } from '@mutual-metrics/shared'; // Importamos la respuesta para tipar correctamente

@Controller('optimizador')
export class OptimizadorController {
  constructor(private readonly optimizadorService: OptimizadorService) {}

  @Post('calcular')
  // Agregamos async y tipamos el retorno con Promise
  async calcularOptimizacion(@Body() datos: OptimizarPrecioRequest): Promise<OptimizarPrecioResponse> {
    // Agregamos el await obligatorio para esperar que el servicio calcule y guarde en SQLite
    return await this.optimizadorService.optimizar(datos);
  }
}
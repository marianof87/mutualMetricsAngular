import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../comunes/persistencia/prisma.service'; // Ajustamos la ruta subiendo dos niveles (de modulares/optimizador a src)
import { OptimizarPrecioRequest, OptimizarPrecioResponse } from '@mutual-metrics/shared';

@Injectable()
export class OptimizadorService {
  
  // Inyectamos el servicio de Prisma de tus compañeros
  constructor(private readonly prisma: PrismaService) {}

  // Agregamos async y Promise ya que el guardado en base de datos es asíncrono
  async optimizar(datos: OptimizarPrecioRequest): Promise<OptimizarPrecioResponse> {
    const { coeficienteA, coeficienteB, coeficienteC, precioMinimo, precioMaximo } = datos;

    // Control de seguridad matemática: si 'a' es mayor o igual a 0, la parábola no tiene un máximo
    if (coeficienteA >= 0) {
      throw new BadRequestException('El coeficiente A debe ser negativo para representar una parábola con un punto máximo de ganancia.');
    }

    // Fórmula del vértice de la parábola: x = -b / (2 * a)
    let precioOptimo = -coeficienteB / (2 * coeficienteA);

    // Forzar que el precio óptimo se mueva dentro de los límites fijados por el usuario
    if (precioOptimo < precioMinimo) {
      precioOptimo = precioMinimo;
    } else if (precioOptimo > precioMaximo) {
      precioOptimo = precioMaximo;
    }

    // Calcular la ganancia máxima usando la función cuadrática: f(x) = ax^2 + bx + c
    const gananciaMaxima = (coeficienteA * Math.pow(precioOptimo, 2)) + (coeficienteB * precioOptimo) + coeficienteC;

    // Redondear a dos decimales de forma limpia para evitar problemas de coma flotante
    const precioFinal = Number(precioOptimo.toFixed(2));
    const gananciaFinal = Number(gananciaMaxima.toFixed(2));

    // Determinar una estrategia sugerida básica según el resultado
    let estrategiaSugerida = 'Mantener precio en el punto de equilibrio óptimo.';
    if (precioFinal === precioMaximo) {
      estrategiaSugerida = 'El mercado tolera un precio mayor. Considerar expandir el límite máximo.';
    } else if (precioFinal === precioMinimo) {
      estrategiaSugerida = 'Demanda débil. Se sugiere mantener el precio en el mínimo para asegurar volumen.';
    }

    const respuesta: OptimizarPrecioResponse = {
      precioOptimo: precioFinal,
      gananciaMaxima: gananciaFinal,
      estrategiaSugerida,
    };

    // OPERACIÓN DE PERSISTENCIA: Guardamos los datos en la tabla local SQLite
    await this.prisma.optimizacion.create({
      data: {
        coeficienteA,
        coeficienteB,
        coeficienteC,
        precioMinimo,
        precioMaximo,
        precioOptimo: respuesta.precioOptimo,
        gananciaMaxima: respuesta.gananciaMaxima,
        estrategiaSugerida: respuesta.estrategiaSugerida,
      },
    });

    return respuesta;
  }
}
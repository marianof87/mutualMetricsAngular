import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { CodigoError } from '@mutual-metrics/shared';

/**
 * Pipe reutilizable para validar el body/query de un endpoint contra un schema Zod.
 *
 * Uso: `@Body(new ZodValidationPipe(MiSchema)) dto: MiDto`
 *
 * Los errores se lanzan como BadRequestException con el código `ENTRADA_INVALIDA`
 * y el filtro global los convierte al envelope estándar.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const resultado = this.schema.safeParse(value);
    if (!resultado.success) {
      throw new BadRequestException({
        code: CodigoError.ENTRADA_INVALIDA,
        message: 'Los datos enviados no son válidos',
        details: resultado.error.issues,
      });
    }
    return resultado.data;
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { CodigoError, crearEnvelopeError } from '@mutual-metrics/shared';

// Normaliza toda excepción no manejada al envelope compartido.
@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepcionesGlobal.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, code, message, details } = this.normalizar(exception);

    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json(crearEnvelopeError(code, message, details));
  }

  private normalizar(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: CodigoError.ENTRADA_INVALIDA,
        message: 'Los datos enviados no son válidos',
        details: exception.issues,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const respuesta = exception.getResponse();
      const datos = typeof respuesta === 'object' ? (respuesta as Record<string, unknown>) : {};

      return {
        status,
        code: (datos['code'] as string) ?? this.codigoPorDefectoParaStatus(status),
        message: (datos['message'] as string) ?? exception.message,
        details: datos['details'],
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: CodigoError.ERROR_INTERNO,
      message: 'Ocurrió un error inesperado',
    };
  }

  private codigoPorDefectoParaStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return CodigoError.ENTRADA_INVALIDA;
      case HttpStatus.UNAUTHORIZED:
        return CodigoError.NO_AUTORIZADO;
      case HttpStatus.FORBIDDEN:
        return CodigoError.PROHIBIDO;
      case HttpStatus.NOT_FOUND:
        return CodigoError.RECURSO_NO_ENCONTRADO;
      case HttpStatus.CONFLICT:
        return CodigoError.CONFLICTO;
      case HttpStatus.TOO_MANY_REQUESTS:
        return CodigoError.LIMITE_EXCEDIDO;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return CodigoError.SERVICIO_NO_DISPONIBLE;
      default:
        return CodigoError.ERROR_INTERNO;
    }
  }
}

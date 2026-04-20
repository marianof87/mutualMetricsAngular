import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { CodigoError, type EnvelopeError } from '@mutual-metrics/shared';

export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => throwError(() => aEnvelope(err))),
  );
};

function aEnvelope(err: unknown): EnvelopeError {
  if (err instanceof HttpErrorResponse) {
    if (esEnvelopeError(err.error)) return err.error;

    return {
      error: {
        code: err.status === 0 ? CodigoError.SERVICIO_NO_DISPONIBLE : CodigoError.ERROR_INTERNO,
        message:
          err.status === 0
            ? 'No se pudo contactar al servidor'
            : err.message || 'Error en la solicitud',
      },
    };
  }

  return {
    error: {
      code: CodigoError.ERROR_INTERNO,
      message: 'Ocurrió un error inesperado en el cliente',
    },
  };
}

function esEnvelopeError(x: unknown): x is EnvelopeError {
  if (typeof x !== 'object' || x === null) return false;
  const error = (x as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return typeof code === 'string' && typeof message === 'string';
}

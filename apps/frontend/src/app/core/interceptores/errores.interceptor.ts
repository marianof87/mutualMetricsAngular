import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CodigoError, CODIGOS_TOKEN_RECHAZADO, type EnvelopeError } from '@mutual-metrics/shared';
import { SesionService } from '../servicios/sesion.service';
import { OMITIR_REDIRECCION_SESION } from './contexto-http';

export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const envelope = aEnvelope(err);
      const omitirRedireccion = req.context.get(OMITIR_REDIRECCION_SESION);
      if (CODIGOS_TOKEN_RECHAZADO.includes(envelope.error.code) && !omitirRedireccion) {
        sesion.cerrarSesion();
        void router.navigate(['/login']);
      }
      return throwError(() => envelope);
    }),
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

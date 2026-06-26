import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CodigoError, type EnvelopeError } from '@mutual-metrics/shared';
import { SesionService } from '../servicios/sesion.service';

// Códigos que significan "tu sesión ya no sirve": limpiamos sesión y mandamos a /login.
// Ojo: AUTH_CREDENCIALES_INVALIDAS NO entra acá (es un login fallido, no una sesión expirada).
const CODIGOS_SESION_INVALIDA: string[] = [
  CodigoError.AUTH_TOKEN_EXPIRADO,
  CodigoError.AUTH_TOKEN_INVALIDO,
];

export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const envelope = aEnvelope(err);
      if (CODIGOS_SESION_INVALIDA.includes(envelope.error.code)) {
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

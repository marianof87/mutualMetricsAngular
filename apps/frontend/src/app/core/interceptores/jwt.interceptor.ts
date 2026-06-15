import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SesionService } from '../servicios/sesion.service';

// Agrega `Authorization: Bearer <token>` a cada request saliente si hay sesión.
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SesionService).obtenerToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

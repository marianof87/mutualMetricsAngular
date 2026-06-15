import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';

// Protege rutas que requieren sesión. Si no hay usuario, redirige a /login.
export const authGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  if (sesion.autenticado()) return true;
  return inject(Router).createUrlTree(['/login']);
};

import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptores/jwt.interceptor';
import { erroresInterceptor } from './core/interceptores/errores.interceptor';
import { SesionService } from './core/servicios/sesion.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // jwt agrega el token saliente; errores normaliza la respuesta entrante.
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor, erroresInterceptor])),
    provideCharts(withDefaultRegisterables()),
    // Al arrancar, revalida el token guardado contra el backend. Va acá (y no
    // en el constructor de SesionService) para que el servicio esté totalmente
    // construido antes de disparar la request y evitar la dependencia circular
    // con los interceptores HTTP.
    provideAppInitializer(() => inject(SesionService).revalidar()),
  ],
};

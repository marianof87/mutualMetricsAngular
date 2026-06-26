import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptores/jwt.interceptor';
import { erroresInterceptor } from './core/interceptores/errores.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // jwt agrega el token saliente; errores normaliza la respuesta entrante.
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor, erroresInterceptor])),
    provideCharts(withDefaultRegisterables())
  ],
};

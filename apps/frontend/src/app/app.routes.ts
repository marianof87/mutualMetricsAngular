import { Routes } from '@angular/router';

// Zona compartida — ver GUIA.md §3. Cada feature se carga con lazy-loading.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/inicio/inicio.component').then((m) => m.InicioComponent),
  },
  {
    path: 'sobre-nosotros',
    loadComponent: () =>
      import('./features/sobre-nosotros/sobre-nosotros.component').then(
        (m) => m.SobreNosotrosComponent,
      ),
  },
  {
    path: 'servicios',
    loadComponent: () =>
      import('./features/servicios/servicios.component').then((m) => m.ServiciosComponent),
  },
  {
    path: 'novedades',
    loadComponent: () =>
      import('./features/novedades/novedades.component').then((m) => m.NovedadesComponent),
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./features/contacto/contacto.component').then((m) => m.ContactoComponent),
  },
  { path: '**', redirectTo: '' },
];

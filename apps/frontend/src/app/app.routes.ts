import { Routes } from '@angular/router';

// Zona compartida — cada dueño de slice registra aquí sus rutas. Ver GUIA.md §3.
// Todas las rutas cargan con lazy-loading para aislar bundles por slice.
export const routes: Routes = [
  // Páginas públicas — Slice 5 (@Ange1809)
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

  // Auth — Slice 1 (@Nubiru)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registrar',
    loadComponent: () =>
      import('./features/auth/registrar/registrar.component').then((m) => m.RegistrarComponent),
  },

  // Calculadoras — Slice 2 (@marianof87) y Slice 3 (@Monzon1983)
  {
    path: 'cuadratica',
    loadComponent: () =>
      import('./features/cuadratica/cuadratica.component').then((m) => m.CuadraticaComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'optimizador',
    loadComponent: () =>
      import('./features/optimizador/optimizador.component').then((m) => m.OptimizadorComponent),
  },
  {
    path: 'financiera',
    loadComponent: () =>
      import('./features/financiera/financiera.component').then((m) => m.FinancieraComponent),
  },

  // Lead Magnet — herramienta interactiva de captación de leads (informe en PDF)
  {
    path: 'lead-magnet',
    loadComponent: () =>
      import('./features/lead-magnet/lead-magnet.component').then((m) => m.LeadMagnetComponent),
  },

  // Historial — Slice 4 (@Franco1212)
  {
    path: 'historial',
    loadComponent: () =>
      import('./features/historial/historial.component').then((m) => m.HistorialComponent),
  },

  { path: '**', redirectTo: '' },
];

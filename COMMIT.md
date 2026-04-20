refactor(repo): divide el proyecto en 5 slices verticales

Asignación del equipo:
- Slice 1 Auth & Usuarios     → @Nubiru
- Slice 2 Cuadratica          → @marianof87
- Slice 3 Pricing             → @Monzon1983
- Slice 4 Historial           → @Franco1212
- Slice 5 Publico & Contacto  → @Ange1809

Cambios:
- Backend: elimina modules/inicio, sobre-nosotros, servicios (eran solo
  paginas sin endpoint). Crea modules/auth, usuarios, cuadratica, pricing,
  escenarios. Actualiza app.module con los nuevos modulos.
- Frontend: crea features/auth/{login,registrar}, cuadratica, pricing,
  historial como stubs con README por slice. Actualiza app.routes.ts y
  navbar con las nuevas rutas.
- Shared: amplia CodigoError con codigos AUTH_*, CUADRATICA_*, PRICING_*.
- Contracts: openapi.yaml actualizado con endpoints de los 5 slices.
- Docs: GUIA.md, README.md, CLAUDE.md, docs/CODIGOS_ERROR.md reescritos
  para reflejar la nueva division. Se elimina la regla de "2 aprobaciones"
  para zonas compartidas; basta 1 review estandar porque todos tocamos
  el sistema horizontalmente.
- CODEOWNERS: reorganizado por slice.
- PR template: checklist por slice.
- Docker: backend.Dockerfile corre `prisma generate` antes de `nest build`
  (sin esto el compile producia dist en path incorrecto). Agrega `ls` de
  verificacion en ambos Dockerfiles para fallar fuerte si el build no emite.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>

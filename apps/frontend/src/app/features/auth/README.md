# Feature: Auth (Slice 1)

**Dueño:** @Nubiru
**Rutas:** `/login`, `/registrar`
**Backend:** `apps/backend/src/modules/auth/` + `apps/backend/src/modules/usuarios/`

## Alcance

- Página de login con form reactivo (email, password).
- Página de registro (email, password, nombre).
- Interceptor HTTP `core/interceptores/jwt.interceptor.ts` que agrega `Authorization: Bearer <token>` a cada request saliente.
- Guard `core/guards/auth.guard.ts` para rutas protegidas.
- Signal global `usuarioActual()` en `core/servicios/sesion.service.ts` con el usuario autenticado (o `null`).
- Persistencia del token en `localStorage` (con cleanup al logout).

## Estado

- [x] Schemas `Auth*Request/Response` en `packages/shared/src/dtos/auth.ts`
- [x] Endpoints backend (registrar, login) — `AuthService` con bcrypt + JWT, tests unit
- [x] Modelo `Usuario` en Prisma + migración
- [x] Backend: `JwtAuthGuard` + `modules/usuarios` (`GET/PATCH /usuarios/yo`), tests unit + integración (supertest)
- [x] Frontend: `jwt.interceptor` + `auth.guard` + `SesionService` con signal `usuarioActual()` (token en localStorage, SSR-safe)
- [x] Forms login y registrar con validación y manejo de errores del envelope
- [x] Tests frontend (service, interceptor, guard, ambos componentes)

> Pendiente menor: el navbar (zona compartida de Slice 5) podría mostrar login/logout según `usuarioActual()`. Lo dejamos para coordinar con @Ange1809.

> Decisión (2026-06-15): el endpoint `refresh` queda para una fase posterior; el contrato OpenAPI no lo incluye, así que no se implementa en el MVP para mantener código y contrato alineados.

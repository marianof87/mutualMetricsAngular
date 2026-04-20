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

- [ ] Schemas `Auth*Request/Response` en `packages/shared/src/dtos/auth.ts`
- [ ] Endpoints backend (registrar, login, refresh)
- [ ] Modelo `Usuario` en Prisma + migración
- [ ] Guard + interceptor + signal de sesión
- [ ] Forms login y registrar con validación y manejo de errores del envelope
- [ ] Tests

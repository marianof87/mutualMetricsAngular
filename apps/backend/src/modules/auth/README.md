# Módulo backend: Auth (Slice 1)

**Dueño:** @Nubiru
**Feature frontend:** `apps/frontend/src/app/features/auth/`

## Alcance

Autenticación por JWT: registro de usuarios, login, refresh de token. Guarda contraseña hasheada con bcrypt. Exporta `AuthService` para que otros módulos validen el token.

## Endpoints propuestos

| Método | Ruta | Request | Response | Errores |
|---|---|---|---|---|
| POST | `/api/v1/auth/registrar` | `RegistrarRequest` | `201 SesionResponse` | `AUTH_EMAIL_YA_REGISTRADO` |
| POST | `/api/v1/auth/login` | `LoginRequest` | `200 SesionResponse` | `AUTH_CREDENCIALES_INVALIDAS` |
| POST | `/api/v1/auth/refresh` | `RefreshRequest` | `200 SesionResponse` | `AUTH_TOKEN_EXPIRADO` |

## DTOs a crear en `packages/shared/src/dtos/auth.ts`

- `RegistrarRequestSchema` (email, password, nombre)
- `LoginRequestSchema` (email, password)
- `SesionResponseSchema` (accessToken, refreshToken, usuario)

## Códigos de error a agregar en `packages/shared/src/errores/codigos.ts`

- `AUTH_CREDENCIALES_INVALIDAS`
- `AUTH_EMAIL_YA_REGISTRADO`
- `AUTH_TOKEN_EXPIRADO`
- `AUTH_TOKEN_INVALIDO`

## DB (Prisma)

Agregar modelo `Usuario` en `apps/backend/prisma/schema.prisma`:

```prisma
model Usuario {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  nombre       String
  creadoEn     DateTime @default(now())
}
```

Después correr `npm run prisma:migrate -- --name agrega-usuario`.

## Cross-cutting

Este módulo afecta a todos los demás — cuando esté listo, los otros slices pueden proteger sus endpoints con un guard global `JwtAuthGuard` que consumirá este `AuthService`.

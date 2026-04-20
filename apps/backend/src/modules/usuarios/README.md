# Módulo backend: Usuarios (Slice 1)

**Dueño:** @Nubiru
**Feature frontend:** perfil dentro de `features/auth/`

## Alcance

Gestión del perfil del usuario autenticado. CRUD scoped al usuario del JWT.

## Endpoints propuestos

| Método | Ruta | Request | Response | Errores |
|---|---|---|---|---|
| GET | `/api/v1/usuarios/yo` | — | `Usuario` | `AUTH_TOKEN_INVALIDO` |
| PATCH | `/api/v1/usuarios/yo` | `UsuarioUpdate` | `Usuario` | `ENTRADA_INVALIDA` |

## Notas

Comparte el modelo Prisma `Usuario` con el módulo `auth/`. Importa `AuthService` para validar el JWT entrante.

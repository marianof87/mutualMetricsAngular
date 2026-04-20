# Feature: Historial (Slice 4)

**Dueño:** @Franco1212
**Ruta:** `/historial` (protegida por auth guard)
**Backend:** `apps/backend/src/modules/escenarios/`
**Shared:** `packages/shared/src/dtos/escenarios.ts` (usa `Paginado<T>` ya existente)

## Alcance

- Tabla paginada de escenarios guardados del usuario actual.
- Filtro por tipo (`cuadratica` / `pricing`).
- Detalle: inputs + outputs de un escenario específico.
- Acción "re-ejecutar" — navega a `/cuadratica` o `/pricing` con los inputs precargados.
- Acción "borrar".

## Estado

- [ ] Schemas `EscenarioCreate`, `Escenario`, `Paginado<Escenario>` en shared
- [ ] Modelo `Escenario` en Prisma + migración (FK a `Usuario`)
- [ ] Endpoints backend (CRUD paginado scoped por JWT) + tests
- [ ] Tabla + filtros + paginator en el frontend
- [ ] Vista detalle
- [ ] Integración con form de Slice 2 y Slice 3 (pre-cargado de inputs)
- [ ] Tests

## Dependencia

Necesita que Slice 1 (Auth) esté listo para extraer el `usuarioId` del JWT. Mientras tanto, podés desarrollar con un header custom `X-Mock-User-Id` y un middleware que lo lea. Swap a JWT cuando Slice 1 mergee.

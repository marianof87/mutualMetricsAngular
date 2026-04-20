# Guía de contribución

Checklist resumido. Para el contexto completo leé [`GUIA.md`](../GUIA.md).

## Antes de empezar una tarea

- [ ] `git pull` en `main`.
- [ ] Crear rama `feature/<seccion>/<descripcion>`.
- [ ] Si tocás zona compartida, avisá al grupo.

## Mientras codeás

- [ ] Commits chicos y con mensaje significativo (Conventional Commits en español).
- [ ] Tests para la lógica nueva.
- [ ] Nada de `console.log` olvidados, ni comentarios `// TODO` sin issue.
- [ ] Variables, funciones y archivos **en español** (salvo identificadores estándar del ecosistema).

## Antes de abrir el PR

- [ ] `npm run build` funciona.
- [ ] `npm test` verde.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Revisaste el `git diff` vos mismo y no hay ruido (archivos random, prints, secretos).
- [ ] Si agregaste endpoints: actualizaste `contracts/openapi.yaml`.
- [ ] Si agregaste códigos de error: actualizaste `docs/CODIGOS_ERROR.md` y `packages/shared/src/errores/codigos.ts`.
- [ ] Actualizaste el README de tu sección si el alcance cambió.

## Review

- [ ] Al menos 1 aprobación para merge a `main`.
- [ ] Zona compartida → al menos 2 aprobaciones.
- [ ] CI verde.
- [ ] Squash-merge con mensaje limpio (editable desde la UI de GitHub).

## Resolver conflictos

- Si `main` avanzó mientras trabajabas:
  ```bash
  git checkout main && git pull
  git checkout feature/mi-rama
  git rebase main
  # resolvé conflictos
  git push --force-with-lease
  ```
- **Nunca `git push --force` pelado.** Siempre `--force-with-lease`.
- Si tenés dudas en el rebase, pedile ayuda al grupo antes de destruir el historial.

## Qué no hacer

- ❌ Commitear `node_modules/`, `dist/`, `.env`.
- ❌ Editar carpetas `features/<seccion>/` o `modules/<seccion>/` que no son tuyas sin avisar.
- ❌ Hacer PRs gigantes (>500 líneas). Partilo en varios.
- ❌ Mergear tu propio PR sin review.
- ❌ Mergear con CI en rojo.

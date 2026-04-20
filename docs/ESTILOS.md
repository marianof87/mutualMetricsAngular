# Sistema de estilos — MutualMetrics

**Stack:** Plain CSS + design tokens + cascada. Sin framework.

## Archivos

```
apps/frontend/src/styles/
├── tokens.css       # Todas las variables --mm-*
├── base.css         # Reset + estilos de elementos HTML
└── utilidades.css   # Clases reutilizables: .contenedor, .panel-vidrio, .animar-entrada
```

Entrada única: `apps/frontend/src/styles.css` importa los tres.

## Regla principal

**Los componentes referencian tokens, no valores literales.**

✅ Bien:
```css
.card {
  padding: var(--mm-space-4);
  border-radius: var(--mm-radius-md);
  background: var(--mm-color-superficie);
}
```

❌ Mal:
```css
.card {
  padding: 16px;
  border-radius: 8px;
  background: #1a1d2d;
}
```

## Naming de tokens

`--mm-<categoria>-<variante>[-<escala>]`

| Categoría | Ejemplos |
|---|---|
| `color` | `--mm-color-fondo`, `--mm-color-texto-tenue`, `--mm-color-error` |
| `space` | `--mm-space-1` (4px) a `--mm-space-8` (64px) |
| `radius` | `--mm-radius-sm`, `--mm-radius-md`, `--mm-radius-lg`, `--mm-radius-pill` |
| `shadow` | `--mm-shadow-sm`, `--mm-shadow-md`, `--mm-shadow-lg` |
| `font-size` | `--mm-font-size-xs` a `--mm-font-size-3xl` |
| `font-weight` | `--mm-font-weight-regular/medium/semibold/bold` |
| `transition` | `--mm-transition-rapida/media` |
| `size` | `--mm-size-contenedor-max` |
| `z` | `--mm-z-sticky`, `--mm-z-modal`, `--mm-z-toast` |

## Agregar un token nuevo

1. Agregalo a `tokens.css` siguiendo el naming.
2. Mencionalo en el PR.
3. Usalo en tu componente.

No agregues tokens casuales ("un rosa para esta pantalla"). Si necesitás variación, hacela derivada de los colores existentes o proponé una extensión al grupo.

## Clases utilitarias

| Clase | Para qué |
|---|---|
| `.contenedor` | Caja centrada de 1200 px. Ya aplicada en `<main>` del layout root. |
| `.panel-vidrio` | Efecto glassmorphism (usado por el navbar). |
| `.animar-entrada` | Fade-in sutil al entrar a la ruta. |
| `.visualmente-oculto` | Oculta visualmente pero accesible para screen readers. |

## Responsive

Breakpoints sugeridos (agregar como tokens cuando los necesitemos):
- Mobile-first por default.
- `@media (min-width: 48rem)` para tablet (768px).
- `@media (min-width: 64rem)` para desktop (1024px).

## Accesibilidad

- Contraste mínimo AA (4.5:1 texto normal, 3:1 texto grande).
- `:focus-visible` ya estilado en `base.css` — **no** sobrescribir con `outline: none`.
- Usar elementos semánticos (`<button>`, `<nav>`, `<main>`) antes que `<div>`.

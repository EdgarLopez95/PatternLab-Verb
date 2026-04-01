# Sistema de diseño — PatternLab Verbs

Documento de referencia para implementación en código. Si el informe original en Word difiere, actualizar **este archivo** como fuente de verdad en el repo.

## Principios

- **Claridad pedagógica** primero: jerarquía tipográfica legible, poco ruido visual.
- **Tema claro por defecto** (dashboard educativo); **tema oscuro** opcional y persistente (`localStorage`).
- **Accesibilidad**: contraste texto/fondo ≥ WCAG AA en componentes principales; foco visible (`:focus-visible`).

---

## Paleta (tema claro — `data-theme="light"` o ausencia de `data-theme="dark"`)

| Token CSS | Uso | Valor |
|-----------|-----|-------|
| `--color-bg` | Fondo página | `#f4f2fb` |
| `--color-surface` | Tarjetas, inputs | `#ffffff` |
| `--color-surface-elevated` | Superficies destacadas | `#faf8ff` |
| `--color-text` | Texto principal | `#1a1823` |
| `--color-text-muted` | Secundario | `#5c5a6b` |
| `--color-border` | Bordes | `#e4e0f0` |
| `--color-border-strong` | Énfasis | `#d0c8e8` |
| `--color-primary` | Marca, enlaces, acentos UI | `#6557d9` |
| `--color-primary-hover` | Hover botón primario | `#5448c4` |
| `--color-primary-soft` | Fondo pills / chips | `#ede9fe` |
| `--color-primary-soft-text` | Texto sobre soft | `#4338ca` |
| `--color-success` | Correcto, reforzado positivo | `#059669` |
| `--color-danger` | Error, alerta | `#dc2626` |
| `--shadow-card` | Sombra tarjetas | `0 1px 3px rgba(26, 24, 35, 0.06), 0 4px 12px rgba(101, 87, 217, 0.06)` |

## Paleta (tema oscuro — `data-theme="dark"`)

| Token | Valor |
|-------|-------|
| `--color-bg` | `#12101a` |
| `--color-surface` | `#1c1a26` |
| `--color-surface-elevated` | `#252330` |
| `--color-text` | `#f0eef8` |
| `--color-text-muted` | `#a09cb0` |
| `--color-border` | `#353244` |
| `--color-border-strong` | `#45405a` |
| `--color-primary` | `#9d8ff5` |
| `--color-primary-hover` | `#b4a9f7` |
| `--color-primary-soft` | `#2f2a45` |
| `--color-primary-soft-text` | `#c4b8fc` |
| `--color-success` | `#34d399` |
| `--color-danger` | `#f87171` |

## Tipografía

- **Familia:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (400, 500, 600, 700). Código / números tabulares: `var(--font-mono)` donde aplique.
- **Pesos:** `--font-weight-normal` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700), `--font-weight-extrabold` (800).
- **Interlineado:** `--leading-none` … `--leading-loose` (ver `:root` en `styles.css`).
- **Tracking:** `--letter-tight`, `--letter-wide`, `--letter-label`, `--letter-caps`.

### Escala tipográfica (tokens)

| Token | Tamaño aprox. | Uso |
|-------|----------------|-----|
| `--text-2xs` | 11px | Chrome mínimo, badges densos |
| `--text-xs` | 12px | Labels, captions, meta |
| `--text-sm` | 13px | Texto secundario, chips, listas compactas |
| `--text-md` | 14px | Cuerpo denso, UI secundaria |
| `--text-base` | 16px | Cuerpo estándar, inputs |
| `--text-lg` | 17px | Lead / descripción hero (`.app-tagline`), énfasis suave |
| `--text-xl` … `--text-3xl` | 18–22px | Subtítulos de vista, resultados |
| `--text-4xl` | 24px | Títulos de sección destacados |
| `--text-5xl` | 28px | Marca / hero (`.app-title`) |
| `--text-display` | ~30px | HUD numérico (timer speed) |

**Jerarquía recomendada:** título app → `--text-5xl` / bold; título de vista → `--text-3xl` o `--text-2xl` / semibold; secciones Learn → `--text-lg`–`--text-base`; cuerpo → `--text-base` con `--leading-normal` o `--leading-loose` en prosa larga; kickers → `--text-2xs`–`--text-xs` + uppercase + `--letter-label`.

## Espaciado

- Escala **4px** en `rem`: `--space-1` (4) … `--space-8` (32), más `--space-5` (20) y `--space-7` (28) para ritmos intermedios.
- **Regla:** preferir solo estos tokens para `margin`, `padding`, `gap` y `row-gap`/`column-gap` en componentes nuevos; evitar `0.35rem`, `0.65rem`, etc.
- Tarjetas: `--card-padding`, `--card-padding-sm`, `--card-gap`.
- Ancho máximo del layout: `--layout-max-width` (1300px).

## Radios y bordes

- `--radius-xs` (4px), `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-pill` (999px).
- **Bordes:** `--border-width` (1px), `--border-width-thick` (2px). Usar `var(--border-width) solid var(--color-border)` en lugar de `1px` suelto.

## Motion

- `--duration-fast` (150ms), `--duration-normal` (200ms), `--ease-standard`, `--transition-interactive` (borde/sombra/fondo/color).
- Respetar `prefers-reduced-motion: reduce` en animaciones y transforms.

## Componentes

### Botón primario

- Fondo `--color-primary`, texto blanco en claro; en oscuro texto `#12101a` si contraste OK.
- Hover: `--color-primary-hover`.
- `border-radius: var(--radius-md)`, `font-weight: var(--font-weight-semibold)`, `padding` vertical generoso.

### Botón ghost / secundario

- Fondo transparente, borde `--color-border`, texto `--color-text`.

### Botón elección (MC)

- Ancho completo, alineado a la izquierda, hover borde `--color-primary` suave.

### Card modo (home)

- Fondo `--color-surface`, borde `var(--border-width) solid var(--color-border)`, sombra `--shadow-card`.
- Hover: borde `--color-primary` al 35% opacidad o sólido suave, `translateY(-1px)` si `prefers-reduced-motion: no-preference`.

### Pill / tag categoría

- `display: inline-flex`, `padding: var(--space-1) var(--space-2)`, `border-radius: var(--radius-pill)`, fondo `--color-primary-soft`, color `--color-primary-soft-text`, `font-size: var(--text-2xs)`, `font-weight: var(--font-weight-semibold)`.

### Barra superior (`app-shell__bar`)

- Fondo `--color-surface`, borde inferior sutil, marca + toggle tema.
- Sticky opcional para coherencia entre rutas.

### Campos texto

- Fondo `--color-surface` o `--color-bg` según tema; borde `--color-border`; foco ring `--color-primary`.

## Iconografía

- Estilo **línea** (stroke ~1.5), color `--color-primary` en cards home.
- Tamaño contenedor icono: 40×40px en círculo suave `--color-primary-soft`.

## Mapeo a clases existentes

Los tokens alimentan las variables ya usadas por la app con alias semánticos:

- `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--accent-dim`, `--border`, `--danger` → enlazados a `--color-*` para no reescribir todos los selectores de una vez.

---

## Nota sobre el documento Word

El archivo `Informe del Sistema de Diseño.docx` debe mantenerse alineado con este Markdown: cualquier cambio oficial del diseño debe reflejarse aquí para que el equipo y las herramientas trabajen sobre texto versionado.

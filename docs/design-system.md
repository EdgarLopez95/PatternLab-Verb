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

- **Familia:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (400, 500, 600, 700).
- **Escala sugerida:**
  - Hero título app: `1.75rem` / 700
  - `h1` vista: `1.35rem` / 600
  - Cuerpo: `1rem` / 1.5
  - Meta / kicker: `0.72rem` / 600, uppercase, letter-spacing `0.08em`
  - Descripción cards: `0.9rem` / muted

## Espaciado

- Escala base **4px**: `--space-1` 4px … `--space-6` 24px (definido en `:root`).
- Padding tarjeta modo home: `1.25rem 1.35rem`.
- Gap grid home: `1rem`.

## Radios y bordes

- `--radius-sm`: 8px (inputs, pills pequeños)
- `--radius-md`: 12px (botones, cards internas)
- `--radius-lg`: 16px (cards home)

## Componentes

### Botón primario

- Fondo `--color-primary`, texto blanco en claro; en oscuro texto `#12101a` si contraste OK.
- Hover: `--color-primary-hover`.
- `border-radius: var(--radius-md)`, `font-weight: 600`, `padding` vertical generoso.

### Botón ghost / secundario

- Fondo transparente, borde `--color-border`, texto `--color-text`.

### Botón elección (MC)

- Ancho completo, alineado a la izquierda, hover borde `--color-primary` suave.

### Card modo (home)

- Fondo `--color-surface`, borde `1px solid var(--color-border)`, sombra `--shadow-card`.
- Hover: borde `--color-primary` al 35% opacidad o sólido suave, `translateY(-1px)` si `prefers-reduced-motion: no-preference`.

### Pill / tag categoría

- `display: inline-flex`, `padding: 0.2rem 0.55rem`, `border-radius: 999px`, fondo `--color-primary-soft`, color `--color-primary-soft-text`, `font-size: 0.7rem`, `font-weight: 600`.

### Barra superior (`app-shell__bar`)

- Fondo `--color-surface`, borde inferior sutil, marca + toggle tema.
- Sticky opcional para coherencia entre rutas.

### Campos texto

- Fondo `--color-surface` o `--color-bg` según tema; borde `--color-border`; foco ring `--color-primary`.

## Iconografía

- Estilo **línea** (stroke ~1.5), color `--color-primary` en cards home.
- Tamaño contenedor icono: 40×40px en círculo suave `--color-primary-soft`.

## Motion

- Transiciones UI: `150–200ms` `ease`.
- Respetar `prefers-reduced-motion: reduce` (reducir o eliminar transform/animaciones).

## Mapeo a clases existentes

Los tokens alimentan las variables ya usadas por la app con alias semánticos:

- `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--accent-dim`, `--border`, `--danger` → enlazados a `--color-*` para no reescribir todos los selectores de una vez.

---

## Nota sobre el documento Word

El archivo `Informe del Sistema de Diseño.docx` debe mantenerse alineado con este Markdown: cualquier cambio oficial del diseño debe reflejarse aquí para que el equipo y las herramientas trabajen sobre texto versionado.

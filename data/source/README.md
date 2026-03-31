# Ingesta de listas de verbos (documento externo)

## Lista curada en el repo

- **`verbs_curated.csv`** — fuente maestra versionada (`group`, `rank`, `verb`, `meaning_es`, `recommended`, `id`). Columnas `group`: `solo_to`, `solo_ing`, `both_no_change`, `both_change`.
- Tras editar el CSV, regenera JSON con: `node scripts/apply-verb-expansion.mjs` y comprueba con `node scripts/validate-data.mjs`.

El archivo Word del escritorio no se versiona aquí. Para añadir verbos desde otro informe:

1. Exporta el `.docx` a **CSV** o **Markdown** usando las columnas de `verb_list_template.csv` (o alinea filas con `verbs_curated.csv`).
2. Mapea la columna `group` a valores internos:
   - `only_to` → `only_infinitive` + lección `pat_infinitive`
   - `only_ing` → `only_gerund` + `pat_gerund`
   - `both_meaning_change` → `both_change` + `pat_both_change` (+ filas en `speed_contexts.json`)
   - `both_same_meaning` → `both_same` + `pat_both_same` (sin Speed binario)
3. **Decisión de producto (Opción A):** los verbos “both sin cambio de significado” usan `pattern_behavior: "both_same"` y el patrón `pat_both_same` en `patterns.json`.

Validación: `node scripts/validate-data.mjs`.

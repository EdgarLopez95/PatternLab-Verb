# AGENTS.md

## Objetivo del producto

Construir una aplicación web ligera para practicar inglés con enfoque en **verb patterns** usando contenido estructurado en JSON.

La app debe:
- cargar datos desde archivos JSON
- generar ejercicios de forma dinámica
- validar respuestas de manera inmediata
- mantener una UX rápida, simple y sin distracciones
- no guardar progreso del usuario por ahora

## Naturaleza del proyecto

Este proyecto es **data-driven**.

La lógica de la aplicación depende de relaciones consistentes entre estos archivos:

- `data/core/verbs.json`
- `data/core/patterns.json`
- `data/content/examples.json`
- `data/exercises/exercises.json`

El frontend debe consumir estos datos y renderizar ejercicios sin hardcodear contenido que ya exista en JSON.

## Cómo trabajar con el agente

- Antes de hacer cambios no triviales, propone un plan breve con:
  - archivos a tocar
  - objetivo del cambio
  - forma de verificación
- Mantén los cambios pequeños y revisables.
- No agregues arquitectura, librerías o abstracciones no solicitadas.
- No inventes nuevos campos JSON sin necesidad clara.
- No renombres claves, IDs o rutas existentes sin revisar su impacto en los demás archivos.
- Si una tarea afecta datos y UI al mismo tiempo, prioriza primero la consistencia de datos.
- Si falta contexto importante, pregunta o deja el cambio preparado sin asumir demasiado.

## Estructura actual del proyecto

- `data/`
  - `core/` → datos base del sistema (`verbs.json`, `patterns.json`)
  - `content/` → contenido pedagógico (`examples.json`)
  - `exercises/` → definición de ejercicios (`exercises.json`)
  - `config/` → configuración general (`settings.json`)
- `src/` → lógica de aplicación y módulos de frontend
- `docs/`
  - `architecture/overview.md`
  - `requirements.md`
- `.cursor/`
  - `rules/` → reglas de contexto para Cursor
  - `skills/` → habilidades reutilizables
- raíz:
  - `index.html`
  - `main.js`
  - `styles.css`

## Fuente de verdad

La fuente de verdad para datos y relaciones está en `data/`.

Regla general:
- `verbs.json` define verbos y sus relaciones principales
- `patterns.json` define patrones gramaticales
- `examples.json` conecta verbos + patrones + contenido de ejemplo
- `exercises.json` define la interacción usando referencias a ejemplos

Si hay conflicto entre UI y datos, corrige primero los datos o adapta la UI sin romper la estructura base.

## Principios de arquitectura

- Separar claramente:
  - datos
  - lógica
  - presentación
- Mantener el proyecto simple, modular y fácil de escalar.
- Preferir funciones pequeñas y previsibles.
- Evitar lógica de negocio mezclada directamente en el render.
- Evitar duplicación innecesaria entre archivos JSON.
- Reutilizar estructuras existentes antes de crear nuevas.
- Mantener el frontend minimalista: rápido, claro y centrado en práctica.

## Reglas para trabajar con JSON

- Mantén IDs estables, únicos y consistentes.
- No crees referencias huérfanas.
- No dupliques información si puede resolverse por referencia.
- Respeta la estructura actual de cada archivo.
- Si agregas nuevos objetos, sigue la convención de nombres y campos existente.
- Si cambias una estructura JSON, revisa todas las dependencias relacionadas.

## Reglas para frontend

- No hardcodees verbos, patrones, ejemplos o ejercicios que ya existan en `data/`.
- La UI debe renderizar desde datos.
- Mantén HTML, CSS y JS sencillos.
- Evita estado complejo si no es necesario.
- Prioriza claridad, velocidad y mantenibilidad sobre efectos visuales innecesarios.

## Práctica: selección y métricas de sesión

- La selección de ejercicios usa `selection.recentBufferSize` y la lógica en `src/domain/exercisePicker.js`. Los ajustes permitidos en iteraciones pequeñas son principalmente **valores en `settings.json`** y documentación; no reescribir el algoritmo sin revisión explícita.
- La UI puede mostrar contadores de sesión (`incorrectCount`, uso de “Show hint”) si `settings.ui.showSessionStats` es `true`. Son **solo memoria de la pestaña**; no sustituyen analytics ni persistencia.

## Verificación antes de dar una tarea por terminada

Antes de cerrar una tarea, verifica en lo posible:

- que no se hayan roto rutas de archivos
- que las referencias entre JSON sigan siendo válidas
- que no haya claves renombradas accidentalmente
- que el cambio sea coherente con la estructura del repo
- que no se haya introducido lógica duplicada
- que el frontend siga funcionando sin errores obvios de runtime
- en cambios de práctica: comprobar **Practice**, **Mixed**, **Tricky** y **Speed** al menos una pregunta cada uno; en **Learn**, las tres lecciones del índice
- ejecutar `node scripts/validate-data.mjs` cuando se toquen JSON en `data/`

## Definition of Done

Un cambio se considera terminado cuando:

- cumple exactamente el objetivo pedido
- respeta la estructura actual del proyecto
- no rompe relaciones entre archivos JSON
- no introduce complejidad innecesaria
- mantiene consistencia entre datos, lógica y UI
- deja el código y los datos en un estado claro y revisable

## Cuándo usar skills

Usa las skills del proyecto cuando aplique:

- `review-data-consistency` → revisar integridad y consistencia entre JSON
- `expand-json-data` → ampliar datos manteniendo referencias válidas
- `create-exercise-type` → agregar un nuevo tipo de ejercicio sin romper la estructura existente
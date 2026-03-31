# Architecture overview

## Layers

1. **Data** — JSON under `data/` (`core`, `content`, `exercises`, `config`) loaded by the catalog builder.
2. **Domain** — Pure functions: `buildCatalog`, `resolveExercise`, `validateAnswer`, `pickNextExerciseId` (`exercisePicker.js`), and **Speed tap** (`speedTap.js`: pool from `verbs.json` + `speed_contexts.json`, validate binary gerund/infinitive).
3. **Features** — Views: `homeView`, `learnView`, `practiceView`, `speedDrillView` (Speed only); practice rendering helpers in `renderExercise.js` and `practiceUiSettings.js`.
4. **Shell** — `main.js`, `router.js`, `index.html`, `styles.css`.

Data flows from JSON → catalog maps (`verbsById`, `exercisesById`, …) → views render and attach listeners. No server round-trips.

## Practice modes

| Mode | Role |
|------|------|
| `practice` | General pool (verb-pattern exercises by default); optional hash filter `#/practice/practice/{patternId}`. Exercises for `pat_prep_gerund` are **excluded** from the general pool unless `practice.includePrepGerundInGeneralPool` is `true`. |
| `tricky` | Exercises tied to “both change” / tricky verbs (see `settings.tricky`). Prep + gerund exercises are **never** included. |
| `mixed` | Combines exercise types with **type rotation** (`mixed.rotateTypes`, `mixed.typeOrder`) and **tricky weight** (`mixed.trickyWeight`). Prep + gerund exercises are excluded unless `mixed.includePrepGerund` is `true`. |
| `speed` | **Tap-only recognition:** verb (and short context for `both_change` rows from `speed_contexts.json`); two choices **-ing** vs **to + verb**; per-question timer; score bar (Correct / Wrong / time). Does **not** use `exercises.json` or fill-in. Routed via `mountSpeedDrill`. |

**Mixed vs Practice vs Speed:** Mixed **rotates** `multiple_choice` → `fill_blank` → `verb_pattern_behavior` (order from settings) and skews tricky. Practice is uniform random over exercises (all types). Speed is a **separate** interaction model (binary tap on verb/context, no sentence exercises). The exercise-type label applies to Practice, Mixed, and Tricky only—not Speed.

## Exercise selection (anti-repetition)

After each “Next question”, the last exercise id is pushed into an in-memory queue (`pickerState.recentIds`) capped by **`selection.recentBufferSize`** in `settings.json`. The picker avoids reusing ids still inside that window when other candidates exist. Tuning is **numeric only** (e.g. buffer size); the selection algorithm itself is not redesigned in small iterations.

## UI settings (`settings.ui`)

| Key | Purpose |
|-----|---------|
| `appTitle` | App header title. |
| `fillBlankPlaceholder` | Placeholder text for fill-in-the-blank inputs. |
| `enterToAdvanceOnCorrect` | If `true`, after a **correct** fill-blank answer, **Enter** triggers “Next question” (default `false` to avoid skipping feedback). |
| `showSessionStats` | If `true`, shows in-session line for wrong answers and hint usage (memory only). |
| `showPracticeScoreCounters` | If `true` (default), Practice / Mixed / Tricky show a subtle **Correct / Wrong** line in the header. Speed always shows its own score HUD. |

## Session tracking (frontend only)

`practiceView` keeps `correctCount`, `incorrectCount` (includes timeouts on modes that use timers), and `hintRevealCount` for the current mount. `speedDrillView` keeps its own Correct/Wrong counts. No `localStorage` or backend. Optional “Show hint” in classic practice uses the same hint text as post-answer feedback, shown before submit.

## Speed settings (`settings.speed`)

| Key | Purpose |
|-----|---------|
| `secondsPerQuestion` | Countdown per tap round (default 10s). |
| `postAnswerDelayMsCorrect` / `postAnswerDelayMsWrong` | Pause after a tap before the next round; use `0` to require **Continue** instead of auto-advance. |
| `postAnswerDelayMsTimeout` | Pause after a time-out (wrong + “correct: …” shown) before the next round; defaults to at least 1000ms if omitted. |
| `recentBufferSize` | Anti-repetition window for Speed item ids (falls back to `selection.recentBufferSize`). |

## Preposition + gerund (`pat_prep_gerund`)

**Family:** Collocations and fixed phrases where **-ing** follows a preposition (*interested in learning*, *after eating*). Distinct from the main **Verb + -ing** lesson (`pat_gerund`).

**Data:**

- Pattern `pat_prep_gerund` in `patterns.json` with `learn_kind: "prep_gerund"`.
- `data/content/prep_gerund_collocations.json` — units: `id`, `display_phrase`, `subcategory` (`adj_prep` | `subordinator` | `verb_prep`), `sort_order`.
- Examples may omit `verb_id` when `pattern_id` is `pat_prep_gerund`; they must set `collocation_id`. Classic examples still require `verb_id`.

**Practice:** Filtered URL `#/practice/practice/pat_prep_gerund`. General practice and Mixed omit these exercises by default via `practice.includePrepGerundInGeneralPool` and `mixed.includePrepGerund` (both default `false` in `settings.json`).

**Speed:** Not part of Speed drill (unchanged binary gerund vs infinitive on matrix verbs).

---

*Last aligned with the “full quality iteration” plan: baseline validation via `node scripts/validate-data.mjs`; manual smoke for Learn, all practice modes, and console errors.*

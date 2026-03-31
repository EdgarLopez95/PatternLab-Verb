# Architecture overview

## Layers

1. **Data** — JSON under `data/` (`core`, `content`, `exercises`, `config`) loaded by the catalog builder.
2. **Domain** — Pure functions: `buildCatalog`, `resolveExercise`, `validateAnswer`, `pickNextExerciseId` (exercise selection pools and mode rules live in `exercisePicker.js`).
3. **Features** — Views: `homeView`, `learnView`, `practiceView`; practice rendering helpers in `renderExercise.js` and `practiceUiSettings.js`.
4. **Shell** — `main.js`, `router.js`, `index.html`, `styles.css`.

Data flows from JSON → catalog maps (`verbsById`, `exercisesById`, …) → views render and attach listeners. No server round-trips.

## Practice modes

| Mode | Role |
|------|------|
| `practice` | General pool; optional hash filter `#/practice/practice/{patternId}`. |
| `tricky` | Exercises tied to “both change” / tricky verbs (see `settings.tricky`). |
| `mixed` | Combines exercise types with **type rotation** (`mixed.rotateTypes`, `mixed.typeOrder`) and **tricky weight** (`mixed.trickyWeight`). Shuffle of options is configurable. |
| `speed` | Timed advance per `settings.speed`. |

**Mixed vs Practice:** Mixed is not just a wider pool—it **rotates** `multiple_choice` → `fill_blank` → `verb_pattern_behavior` (order from settings) so the session visibly alternates formats. Practice does not apply that rotation. The UI exercise-type label should appear in **all** modes so Mixed is easy to recognize.

## Exercise selection (anti-repetition)

After each “Next question”, the last exercise id is pushed into an in-memory queue (`pickerState.recentIds`) capped by **`selection.recentBufferSize`** in `settings.json`. The picker avoids reusing ids still inside that window when other candidates exist. Tuning is **numeric only** (e.g. buffer size); the selection algorithm itself is not redesigned in small iterations.

## UI settings (`settings.ui`)

| Key | Purpose |
|-----|---------|
| `appTitle` | App header title. |
| `fillBlankPlaceholder` | Placeholder text for fill-in-the-blank inputs. |
| `enterToAdvanceOnCorrect` | If `true`, after a **correct** fill-blank answer, **Enter** triggers “Next question” (default `false` to avoid skipping feedback). |
| `showSessionStats` | If `true`, shows in-session counters for incorrect answers and hint usage (memory only, no persistence). |

## Session tracking (frontend only)

`practiceView` keeps `incorrectCount` and `hintRevealCount` for the current mount (navigating Home or reloading resets them). No `localStorage` or backend. Optional “Show hint” uses the same hint text as post-answer feedback, shown before submit.

## Future module (design only): Preposition + Gerund

**Goal:** A separate family from “verb + gerund / infinitive”: patterns like *interested in **doing***, *good at **swimming*** (preposition + gerund collocations).

**Data sketch (not implemented):**

- New pattern id (e.g. `pat_prep_gerund`) with its own `learn_kind` or naming convention so it does not collide with `pat_gerund` (“matrix verb + second verb form”).
- Verbs/examples either use dedicated fields or dedicated `pattern_usages` ids **only** for this family—avoid mixing rows with classic gerund-only matrix verbs.
- Reuse exercise types (`fill_blank`, `multiple_choice`) where the stem encodes the collocation.
- **Rollout:** Learn + a dedicated practice mode (or filtered practice) **before** blending into Mixed, to keep pedagogy clear.

---

*Last aligned with the “full quality iteration” plan: baseline validation via `node scripts/validate-data.mjs`; manual smoke for Learn, all practice modes, and console errors.*

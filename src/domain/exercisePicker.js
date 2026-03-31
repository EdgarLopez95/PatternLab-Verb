/**
 * Exercise pools and selection by mode. Practice = uniform random; Mixed = tricky
 * weight + optional type rotation; Tricky = dual-meaning filter with fallbacks;
 * Speed = optional type filter from settings.
 */

/**
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {object} exercise
 */
function getVerbId(catalog, exercise) {
  if (exercise.verb_id) return exercise.verb_id;
  if (exercise.example_id) {
    return catalog.examplesById[exercise.example_id]?.verb_id ?? null;
  }
  return null;
}

/**
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {object} exercise
 */
export function isTrickyExercise(catalog, exercise) {
  const st = catalog.settings?.tricky || {};
  const useEx = st.useExampleFlag !== false;
  const useTag = st.useVerbTagMeaningChange !== false;

  if (useEx && exercise.example_id) {
    const ex = catalog.examplesById[exercise.example_id];
    if (ex?.is_tricky) return true;
  }

  if (useTag) {
    const verbId = getVerbId(catalog, exercise);
    if (verbId) {
      const verb = catalog.verbsById[verbId];
      if (verb?.tag_ids?.includes("tag_meaning_change")) return true;
    }
  }

  return false;
}

/**
 * True if the exercise's verb is "both_change" (dual structure / meaning shift).
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {object} exercise
 */
export function verbHasBothChange(catalog, exercise) {
  const verbId = getVerbId(catalog, exercise);
  if (!verbId) return false;
  return catalog.verbsById[verbId]?.pattern_behavior === "both_change";
}

/**
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {object} exercise
 * @param {string} patternId
 */
export function exerciseMatchesPattern(catalog, exercise, patternId) {
  if (!patternId) return true;
  if (exercise.example_id) {
    const ex = catalog.examplesById[exercise.example_id];
    if (ex?.pattern_id === patternId) return true;
  }
  const verbId = exercise.verb_id;
  if (verbId) {
    const v = catalog.verbsById[verbId];
    if (v?.pattern_usages?.includes(patternId)) return true;
  }
  return false;
}

/**
 * @param {object[]} exercises
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {{ patternId?: string | null }} [filterOpts]
 */
function applyPatternFilter(exercises, catalog, filterOpts) {
  const pid = filterOpts?.patternId;
  if (!pid) return exercises;
  const out = exercises.filter((q) => exerciseMatchesPattern(catalog, q, pid));
  return out.length ? out : exercises;
}

/**
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {'practice'|'tricky'|'mixed'|'speed'} mode
 * @param {{ patternId?: string | null }} [filterOpts]
 */
export function getExercisePool(catalog, mode, filterOpts = {}) {
  let all = catalog.exercises.slice();
  all = applyPatternFilter(all, catalog, filterOpts);

  const tricky = all.filter((q) => isTrickyExercise(catalog, q));
  const nonTricky = all.filter((q) => !isTrickyExercise(catalog, q));

  switch (mode) {
    case "practice":
      return all.length ? all : [];
    case "speed": {
      let pool = all;
      const types = catalog.settings?.speed?.exerciseTypes;
      if (Array.isArray(types) && types.length > 0) {
        const narrowed = pool.filter((q) => types.includes(q.type));
        if (narrowed.length) pool = narrowed;
      }
      return pool.length ? pool : all;
    }
    case "tricky": {
      const st = catalog.settings?.tricky || {};
      let cand = tricky;
      if (st.requireVerbBothChange) {
        const narrowed = tricky.filter((q) => verbHasBothChange(catalog, q));
        if (narrowed.length) cand = narrowed;
      }
      return cand.length ? cand : all;
    }
    case "mixed": {
      const tw = catalog.settings?.mixed?.trickyWeight ?? 0.45;
      return { all, tricky, nonTricky, trickyWeight: tw };
    }
    default:
      return all;
  }
}

/**
 * @param {object[]} pool
 * @param {string|null} excludeId
 * @param {string[]} recentIds
 */
function pickRandomExercise(pool, excludeId = null, recentIds = []) {
  const avoid = new Set([excludeId, ...recentIds].filter(Boolean));
  let usable = pool.filter((q) => !avoid.has(q.id));
  if (!usable.length) {
    usable = excludeId != null ? pool.filter((q) => q.id !== excludeId) : pool.slice();
  }
  if (!usable.length) usable = pool.slice();
  const i = Math.floor(Math.random() * usable.length);
  return usable[i];
}

/**
 * @typedef {object} PickerState
 * @property {string[]} [recentIds]
 * @property {number} [mixedTypeIndex]
 */

/**
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {'practice'|'tricky'|'mixed'|'speed'} mode
 * @param {string|null} [excludeExerciseId]
 * @param {PickerState|null} [pickerState]
 * @param {{ patternId?: string | null }} [filterOpts]
 */
export function pickNextExerciseId(
  catalog,
  mode,
  excludeExerciseId = null,
  pickerState = null,
  filterOpts = {}
) {
  const recent = pickerState?.recentIds || [];

  if (mode === "mixed") {
    const pool = getExercisePool(catalog, mode, filterOpts);
    if (pool && pool.all) {
      const mixedCfg = catalog.settings?.mixed || {};
      const rotateTypes = mixedCfg.rotateTypes !== false;
      const typeOrder =
        mixedCfg.typeOrder || [
          "multiple_choice",
          "fill_blank",
          "verb_pattern_behavior",
        ];

      const { all, tricky, nonTricky, trickyWeight } = pool;
      const useTricky = Math.random() < trickyWeight && tricky.length > 0;
      let sub = useTricky ? tricky : nonTricky.length ? nonTricky : all;

      if (rotateTypes && typeOrder.length > 0 && pickerState) {
        const idx = pickerState.mixedTypeIndex || 0;
        const wantType = typeOrder[idx % typeOrder.length];
        pickerState.mixedTypeIndex = idx + 1;
        const byType = sub.filter((q) => q.type === wantType);
        if (byType.length) sub = byType;
      }

      return pickRandomExercise(sub, excludeExerciseId, recent).id;
    }
  }

  const list = getExercisePool(catalog, mode, filterOpts);
  const pool = Array.isArray(list) ? list : list.all;
  return pickRandomExercise(pool, excludeExerciseId, recent).id;
}

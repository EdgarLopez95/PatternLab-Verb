function byId(arr) {
  /** @type {Record<string, object>} */
  const out = {};
  for (const item of arr) {
    out[item.id] = item;
  }
  return out;
}

/** @param {Record<string, unknown>} raw */
export function buildCatalog(raw) {
  return {
    verbs: raw.verbs,
    patterns: raw.patterns,
    examples: raw.examples,
    exercises: raw.exercises,
    feedback: raw.feedback,
    settings: raw.settings,
    verbsById: byId(raw.verbs),
    patternsById: byId(raw.patterns),
    examplesById: byId(raw.examples),
    exercisesById: byId(raw.exercises),
    feedbackById: byId(raw.feedback),
  };
}

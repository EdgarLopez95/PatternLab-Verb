const FILES = {
  verbs: "data/core/verbs.json",
  patterns: "data/core/patterns.json",
  examples: "data/content/examples.json",
  exercises: "data/exercises/exercises.json",
  feedback: "data/content/feedback.json",
  speedContexts: "data/content/speed_contexts.json",
  prepGerundCollocations: "data/content/prep_gerund_collocations.json",
  settings: "data/config/settings.json",
};

/**
 * @returns {Promise<{ verbs: object[]; patterns: object[]; examples: object[]; exercises: object[]; feedback: object[]; settings: object }>}
 */
export async function loadAllData() {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, path]) => {
      const res = await fetch(path);
      if (!res.ok) {
        throw new Error(`Failed to load ${path} (${res.status})`);
      }
      const data = await res.json();
      return [key, data];
    })
  );
  return Object.fromEntries(entries);
}

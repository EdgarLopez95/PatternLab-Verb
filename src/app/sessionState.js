export function createSessionState() {
  return {
    /** @type {object | null} */
    catalog: null,
    /** @type {string|null} */
    lastExerciseId: null,
  };
}

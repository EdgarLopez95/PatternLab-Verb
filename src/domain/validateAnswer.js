/**
 * @param {{ case_sensitive?: boolean; trim?: boolean }} validation
 * @param {string|number} value
 */
export function normalizeAnswerValue(value, validation) {
  const v = validation || {};
  let s = value == null ? "" : String(value);
  if (v.trim !== false) s = s.trim();
  if (!v.case_sensitive) s = s.toLowerCase();
  return s;
}

/**
 * @param {object} exercise
 * @param {string} userInput raw answer (option value or typed text)
 */
export function validateAnswer(exercise, userInput) {
  const expected = normalizeAnswerValue(exercise.correct_answer, exercise.validation);
  const got = normalizeAnswerValue(userInput, exercise.validation);
  return { correct: got === expected };
}

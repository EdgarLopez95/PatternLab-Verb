/**
 * Lemma shown next to the gap in fill_blank so the user knows which verb to inflect.
 * Optional exercise.blank_lemma overrides heuristic derivation from correct_answer.
 *
 * @param {{ correct_answer: string; blank_lemma?: string }} exercise
 * @returns {string} lowercase lemma, or "" if nothing reliable
 */
export function blankLemmaForFillExercise(exercise) {
  if (typeof exercise.blank_lemma === "string") {
    const m = exercise.blank_lemma.trim();
    if (m) return m.toLowerCase();
  }
  return deriveLemmaFromAnswer(exercise.correct_answer);
}

/**
 * @param {string} answer
 */
function deriveLemmaFromAnswer(answer) {
  const s = String(answer).trim();
  if (!s) return "";

  const toInf = /^to\s+(.+)$/i.exec(s);
  if (toInf) {
    const rest = toInf[1].trim().toLowerCase();
    return rest || "";
  }

  const lower = s.toLowerCase();
  if (lower.endsWith("ing") && lower.length > 4) {
    let stem = lower.slice(0, -3);
    if (stem.length >= 2 && stem.at(-1) === stem.at(-2)) {
      stem = stem.slice(0, -1);
    }
    return stem;
  }

  return lower;
}

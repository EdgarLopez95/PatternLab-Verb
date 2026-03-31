/** @param {string} [type] */
export function labelForExerciseType(type) {
  switch (type) {
    case "fill_blank":
      return "Fill in the blank";
    case "multiple_choice":
      return "Multiple choice";
    case "verb_pattern_behavior":
      return "Which form? (-ing or to + verb)";
    default:
      return "Exercise";
  }
}

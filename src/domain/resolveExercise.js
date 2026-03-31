import { formatSentenceParts } from "../shared/formatSentence.js";
import { shuffle } from "../shared/shuffle.js";
import { PATTERN_BEHAVIOR_LABELS } from "../shared/patternBehaviorLabels.js";
import { blankLemmaForFillExercise } from "../shared/blankLemma.js";

/**
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {string} exerciseId
 * @param {boolean} shuffleOptions
 */
export function resolveExerciseForView(catalog, exerciseId, shuffleOptions = true) {
  const exercise = catalog.exercisesById[exerciseId];
  if (!exercise) throw new Error(`Unknown exercise: ${exerciseId}`);

  const feedback = catalog.feedbackById[exercise.feedback_id];

  if (exercise.type === "verb_pattern_behavior") {
    const verb = catalog.verbsById[exercise.verb_id];
    const all = [
      { value: exercise.correct_answer, label: labelOrKey(exercise.correct_answer) },
      ...exercise.distractors.map((d) => ({ value: d, label: labelOrKey(d) })),
    ];
    const choices = shuffleOptions ? shuffle(all) : all;
    return {
      kind: "verb_behavior",
      exercise,
      feedback,
      verb,
      choices,
      pattern: null,
      example: null,
    };
  }

  const example = catalog.examplesById[exercise.example_id];
  const verb = example.verb_id ? catalog.verbsById[example.verb_id] : null;
  const pattern = catalog.patternsById[example.pattern_id];
  const collocation = example.collocation_id
    ? catalog.prepGerundCollocationsById[example.collocation_id]
    : null;

  if (exercise.type === "multiple_choice") {
    const all = [
      exercise.correct_answer,
      ...(exercise.distractors || []),
    ].map((text) => ({ value: text, label: text }));
    const choices = shuffleOptions ? shuffle(all) : all;
    const sentence = formatSentenceParts(example, { hideTarget: true });
    return {
      kind: "mc",
      exercise,
      feedback,
      example,
      verb,
      pattern,
      collocation,
      choices,
      sentence,
    };
  }

  if (exercise.type === "fill_blank") {
    const sentence = formatSentenceParts(example, { hideTarget: true });
    const blankLemma = blankLemmaForFillExercise(exercise);
    return {
      kind: "fill",
      exercise,
      feedback,
      example,
      verb,
      pattern,
      collocation,
      choices: null,
      sentence,
      blankLemma,
    };
  }

  throw new Error(`Unsupported exercise type: ${exercise.type}`);
}

/** @param {string} key */
function labelOrKey(key) {
  return PATTERN_BEHAVIOR_LABELS[key] || key;
}

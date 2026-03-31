/**
 * Optional integrity check for JSON under data/.
 * Run: node scripts/validate-data.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const EXERCISE_TYPES = new Set([
  "multiple_choice",
  "fill_blank",
  "verb_pattern_behavior",
]);

const VERB_PATTERN_BEHAVIOR = new Set([
  "only_gerund",
  "only_infinitive",
  "both_change",
  "both_same",
]);

const PATTERN_LEARN_KIND = new Set(["both_change", "both_same", "prep_gerund"]);

const LEARNING_TIERS = new Set(["core", "secondary", "extended"]);

const PAT_PREP_GERUND = "pat_prep_gerund";

const COLLOCATION_SUBCATEGORIES = new Set(["adj_prep", "subordinator", "verb_prep"]);

const SPEED_EXPECTED = new Set(["gerund", "infinitive"]);

function load(name) {
  return JSON.parse(readFileSync(join(root, name), "utf8"));
}

function loadData() {
  return {
    verbs: load("data/core/verbs.json"),
    patterns: load("data/core/patterns.json"),
    examples: load("data/content/examples.json"),
    exercises: load("data/exercises/exercises.json"),
    feedback: load("data/content/feedback.json"),
    speedContexts: load("data/content/speed_contexts.json"),
    prepGerundCollocations: load("data/content/prep_gerund_collocations.json"),
    settings: load("data/config/settings.json"),
  };
}

function indexById(arr) {
  const m = new Map();
  for (const o of arr) {
    if (m.has(o.id)) throw new Error(`Duplicate id: ${o.id}`);
    m.set(o.id, o);
  }
  return m;
}

function main() {
  const d = loadData();
  const verbs = indexById(d.verbs);
  const patterns = indexById(d.patterns);
  const examples = indexById(d.examples);
  const feedback = indexById(d.feedback);
  const prepCollocations = indexById(d.prepGerundCollocations);

  const exerciseTypesInData = new Set();

  for (const p of d.patterns) {
    if (p.summary != null && typeof p.summary !== "string") {
      throw new Error(`Pattern ${p.id}: summary must be string if present`);
    }
    if (p.contrast_note != null && typeof p.contrast_note !== "string") {
      throw new Error(`Pattern ${p.id}: contrast_note must be string if present`);
    }
    if (p.learn_kind != null) {
      if (typeof p.learn_kind !== "string" || !PATTERN_LEARN_KIND.has(p.learn_kind)) {
        throw new Error(
          `Pattern ${p.id}: learn_kind must be one of ${[...PATTERN_LEARN_KIND].join(", ")}`
        );
      }
    }
  }

  indexById(d.speedContexts);

  for (const c of d.prepGerundCollocations) {
    if (!c.id || typeof c.id !== "string") {
      throw new Error(`prep_gerund_collocations: each entry needs string id`);
    }
    if (typeof c.display_phrase !== "string" || !c.display_phrase.trim()) {
      throw new Error(`prep_gerund_collocations ${c.id}: display_phrase must be non-empty string`);
    }
    if (!COLLOCATION_SUBCATEGORIES.has(c.subcategory)) {
      throw new Error(
        `prep_gerund_collocations ${c.id}: subcategory must be one of ${[...COLLOCATION_SUBCATEGORIES].join(", ")}`
      );
    }
    if (typeof c.sort_order !== "number" || !Number.isFinite(c.sort_order)) {
      throw new Error(`prep_gerund_collocations ${c.id}: sort_order must be a finite number`);
    }
  }

  for (const v of d.verbs) {
    if (!VERB_PATTERN_BEHAVIOR.has(v.pattern_behavior)) {
      throw new Error(
        `Verb ${v.id}: pattern_behavior must be one of ${[...VERB_PATTERN_BEHAVIOR].join(", ")}`
      );
    }
    if (typeof v.learning_tier !== "string" || !LEARNING_TIERS.has(v.learning_tier)) {
      throw new Error(
        `Verb ${v.id}: learning_tier must be one of ${[...LEARNING_TIERS].join(", ")}`
      );
    }
    if (v.source_rank != null) {
      if (!Number.isInteger(v.source_rank) || v.source_rank < 1) {
        throw new Error(`Verb ${v.id}: source_rank must be a positive integer if present`);
      }
    }
    if (v.pattern_behavior === "both_same") {
      const ok = v.pattern_usages?.length === 1 && v.pattern_usages[0] === "pat_both_same";
      if (!ok) {
        throw new Error(
          `Verb ${v.id}: both_same verbs must have pattern_usages exactly ["pat_both_same"]`
        );
      }
    }
  }

  for (const row of d.speedContexts) {
    if (!row.id || typeof row.id !== "string") {
      throw new Error(`speed_contexts: each entry needs string id`);
    }
    if (!verbs.has(row.verb_id)) {
      throw new Error(`speed_contexts ${row.id}: unknown verb_id ${row.verb_id}`);
    }
    const v = verbs.get(row.verb_id);
    if (v.pattern_behavior !== "both_change") {
      throw new Error(
        `speed_contexts ${row.id}: verb ${row.verb_id} must have pattern_behavior both_change`
      );
    }
    if (typeof row.context_label !== "string" || !row.context_label.trim()) {
      throw new Error(`speed_contexts ${row.id}: context_label must be non-empty string`);
    }
    if (!SPEED_EXPECTED.has(row.expected)) {
      throw new Error(
        `speed_contexts ${row.id}: expected must be gerund or infinitive, got ${row.expected}`
      );
    }
  }

  for (const v of d.verbs) {
    if (v.pattern_behavior !== "both_change") continue;
    const n = d.speedContexts.filter((r) => r.verb_id === v.id).length;
    if (n < 1) {
      throw new Error(
        `Verb ${v.id} is both_change but has no speed_contexts rows; add at least one`
      );
    }
  }

  for (const ex of d.examples) {
    if (!patterns.has(ex.pattern_id)) throw new Error(`Example ${ex.id} bad pattern_id ${ex.pattern_id}`);

    if (ex.pattern_id === PAT_PREP_GERUND) {
      if (!ex.collocation_id || typeof ex.collocation_id !== "string") {
        throw new Error(`Example ${ex.id}: pat_prep_gerund examples need collocation_id`);
      }
      if (!prepCollocations.has(ex.collocation_id)) {
        throw new Error(`Example ${ex.id}: unknown collocation_id ${ex.collocation_id}`);
      }
      if (ex.verb_id != null && ex.verb_id !== "" && !verbs.has(ex.verb_id)) {
        throw new Error(`Example ${ex.id} bad verb_id ${ex.verb_id}`);
      }
    } else {
      if (!ex.verb_id) throw new Error(`Example ${ex.id} needs verb_id for non–prep-gerund patterns`);
      if (!verbs.has(ex.verb_id)) throw new Error(`Example ${ex.id} bad verb_id ${ex.verb_id}`);
    }
  }

  for (const c of d.prepGerundCollocations) {
    const n = d.examples.filter(
      (ex) => ex.pattern_id === PAT_PREP_GERUND && ex.collocation_id === c.id
    ).length;
    if (n < 1) {
      throw new Error(`prep_gerund_collocations ${c.id} has no examples; add at least one`);
    }
  }

  const prepPattern = patterns.get(PAT_PREP_GERUND);
  if (prepPattern && prepPattern.learn_kind !== "prep_gerund") {
    throw new Error(`Pattern ${PAT_PREP_GERUND} must have learn_kind prep_gerund`);
  }

  for (const q of d.exercises) {
    if (!EXERCISE_TYPES.has(q.type)) {
      throw new Error(`Exercise ${q.id}: unknown type ${q.type}`);
    }
    exerciseTypesInData.add(q.type);

    if (!feedback.has(q.feedback_id)) throw new Error(`Exercise ${q.id} bad feedback_id ${q.feedback_id}`);
    if (q.example_id && !examples.has(q.example_id)) {
      throw new Error(`Exercise ${q.id} bad example_id ${q.example_id}`);
    }
    if (q.verb_id && !verbs.has(q.verb_id)) {
      throw new Error(`Exercise ${q.id} bad verb_id ${q.verb_id}`);
    }
    if (q.type === "verb_pattern_behavior") {
      if (!q.verb_id) throw new Error(`Exercise ${q.id} verb_pattern_behavior needs verb_id`);
      const vb = verbs.get(q.verb_id);
      if (!VERB_PATTERN_BEHAVIOR.has(q.correct_answer)) {
        throw new Error(`Exercise ${q.id}: invalid correct_answer for verb_pattern_behavior`);
      }
      if (vb && q.correct_answer !== vb.pattern_behavior) {
        throw new Error(
          `Exercise ${q.id}: correct_answer "${q.correct_answer}" must match verb ${q.verb_id} pattern_behavior "${vb.pattern_behavior}"`
        );
      }
    } else if (!q.example_id) {
      throw new Error(`Exercise ${q.id} needs example_id`);
    }

    if (q.blank_lemma != null) {
      if (q.type !== "fill_blank") {
        throw new Error(`Exercise ${q.id}: blank_lemma is only allowed for fill_blank`);
      }
      if (typeof q.blank_lemma !== "string" || !q.blank_lemma.trim()) {
        throw new Error(`Exercise ${q.id}: blank_lemma must be a non-empty string if present`);
      }
    }
  }

  const mixedOrder = d.settings?.mixed?.typeOrder;
  if (Array.isArray(mixedOrder)) {
    for (const t of mixedOrder) {
      if (!EXERCISE_TYPES.has(t)) {
        throw new Error(`settings.mixed.typeOrder contains unknown type: ${t}`);
      }
    }
  }

  console.log("OK: data references are consistent.");
}

main();

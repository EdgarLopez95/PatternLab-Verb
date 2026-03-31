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
]);

const PATTERN_LEARN_KIND = new Set(["both_change"]);

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

  for (const v of d.verbs) {
    if (!VERB_PATTERN_BEHAVIOR.has(v.pattern_behavior)) {
      throw new Error(
        `Verb ${v.id}: pattern_behavior must be one of ${[...VERB_PATTERN_BEHAVIOR].join(", ")}`
      );
    }
  }

  for (const ex of d.examples) {
    if (!verbs.has(ex.verb_id)) throw new Error(`Example ${ex.id} bad verb_id ${ex.verb_id}`);
    if (!patterns.has(ex.pattern_id)) throw new Error(`Example ${ex.id} bad pattern_id ${ex.pattern_id}`);
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

  const speedTypes = d.settings?.speed?.exerciseTypes;
  if (Array.isArray(speedTypes)) {
    for (const t of speedTypes) {
      if (!exerciseTypesInData.has(t)) {
        throw new Error(
          `settings.speed.exerciseTypes references "${t}" but no exercise uses that type`
        );
      }
    }
  }

  console.log("OK: data references are consistent.");
}

main();

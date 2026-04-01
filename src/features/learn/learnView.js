import { formatSentenceParts } from "../../shared/formatSentence.js";
import { feedbackBodyToHtml } from "../../shared/feedbackFormat.js";

/** Pedagogical order on the Learn index (must match pattern ids in data). */
const LEARN_INDEX_ORDER = [
  "pat_gerund",
  "pat_infinitive",
  "pat_both_change",
  "pat_both_same",
  "pat_prep_gerund",
];

const PAT_BOTH_CHANGE = "pat_both_change";
const PAT_BOTH_SAME = "pat_both_same";

const SUBCATEGORY_LABELS = {
  adj_prep: "Phrases: interested in, good at, …",
  subordinator: "Words: after, before, without, …",
  verb_prep: "Verb + small word (more later)",
};

/** Card body: one main line (markdown **bold** → HTML). */
const LEARN_CARD_DESCRIPTIONS = {
  pat_gerund:
    "**-ing** after the verb—**enjoy studying**, **finish eating**.",
  pat_infinitive:
    "**To + verb** after the verb—**want to go**, **decide to stay**.",
  pat_both_change:
    "Same verb, **two forms**, **two meanings**—**stop smoking** vs **stop to rest**.",
  pat_both_same:
    "**-ing or to + verb**—the **idea stays the same**.",
  pat_prep_gerund:
    "After **in, after, without**… the next verb is usually **-ing**.",
};

/** One short helper line under the main description. */
const LEARN_CARD_META = {
  pat_gerund: "Not to + verb in this lesson · examples inside",
  pat_infinitive: "Not -ing in this lesson · examples inside",
  pat_both_change: "Contrast with Tricky verbs lesson · examples inside",
  pat_both_same: "Unlike Tricky verbs: different meaning · optional after Core + Contrast",
  pat_prep_gerund: "Phrase lists inside",
};

const LEARN_CARD_PILLS = {
  pat_gerund: [
    { text: "Start here", variant: "start" },
    { text: "Core", variant: "core" },
  ],
  pat_infinitive: [{ text: "Core", variant: "core" }],
  pat_both_change: [{ text: "Contrast", variant: "meaning" }],
  pat_both_same: [{ text: "Optional", variant: "bonus" }],
  pat_prep_gerund: [{ text: "Quick rule", variant: "rule" }],
};

const ICON_CHEVRON = `<svg class="learn-lesson-card__chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;

/** Pedagogical headline (plain English, not only grammar shorthand). */
const LESSON_HERO_TITLE = {
  pat_gerund: "Use -ing after some verbs",
  pat_infinitive: "Use to + verb after some verbs",
  pat_both_change: "Same verb — different meaning",
  pat_both_same: "Either form — same idea",
  pat_prep_gerund: "-ing after a preposition",
};

/** Pattern shorthand under the headline. */
const LESSON_FORMULA = {
  pat_gerund: "verb + -ing",
  pat_infinitive: "verb + to + verb",
  pat_both_change: "verb + -ing   ·   verb + to + verb",
  pat_both_same: "verb + -ing   or   verb + to + verb",
  pat_prep_gerund: "preposition + -ing",
};

/** Opening line in simple, spoken English. */
const LESSON_QUICK_LINE = {
  pat_gerund:
    "After some verbs, the next verb usually ends in **-ing** — think **enjoy reading**, **avoid making**, **finish eating**. **Not** **to + verb** in this lesson.",
  pat_infinitive:
    "After some verbs, the next part is **to** + base verb — think **want to go**, **decide to stay**, **plan to study**. **Not** **-ing** in this lesson.",
  pat_both_change:
    "Some verbs take **-ing** **or** **to + verb**. Here, **switching** the form **switches the meaning** — read the **whole idea**, not only the ending.",
  pat_both_same:
    "Here **both** forms are often fine, and the **meaning** stays **about the same** — you can relax a little.",
  pat_prep_gerund:
    "Here you watch the word **before** the verb (**in**, **after**, **interested in**…). **After that chunk, use -ing** — not **to + verb**.",
};

/** Short “where to look” line for each lesson. */
const LESSON_WHAT_TO_NOTICE = {
  pat_gerund:
    "**What to notice:** look right after verbs like **enjoy**, **avoid**, **finish** — the next verb shows **-ing**, not **to** + verb.",
  pat_infinitive:
    "**What to notice:** look for **to** immediately before the next verb (**want to go**, **hope to see**).",
  pat_both_change:
    "**What to notice:** compare **meaning**, not only grammar — same verb, two different **situations**.",
  pat_both_same:
    "**What to notice:** you can swap **-ing** and **to + verb**; the **story** you tell stays **almost the same**.",
  pat_prep_gerund:
    "**What to notice:** spot the **preposition** (or set phrase like **good at**). **-ing** follows **that**, not the main verb rule from lesson 1.",
};

/** One line under “Examples that show the pattern”. */
const LESSON_EXAMPLES_LEDE = {
  pat_gerund: "Keep your eyes on the **-ing** chunk — that’s the pattern.",
  pat_infinitive: "Keep your eyes on **to** + verb — that’s the pattern.",
  pat_both_change: "Same verb, two boxes — **meaning** is what changes.",
  pat_both_same: "Either ending works; the **situation** stays familiar.",
  pat_prep_gerund: "The **preposition** (or phrase) leads; **-ing** comes next.",
};

/** Short meaning contrast for tricky verbs (shown under each pair). */
const TRICKY_VERB_DIFF = {
  v_remember:
    "**-ing**: you remember something from the past. **To + verb**: don’t forget to do something later.",
  v_forget:
    "**-ing**: you forgot something that happened. **To + verb**: you didn’t do something you should do.",
  v_stop:
    "**-ing**: you stop an activity. **To + verb**: you stop **so you can** do something else.",
  v_try:
    "**-ing**: try something to see what happens. **To + verb**: make an effort to do it.",
  v_regret:
    "**-ing**: you’re sorry about the past. **To + verb**: you’re sorry about what you must say next.",
  v_mean:
    "**-ing**: what words or signs express. **To + verb**: you intend to do something.",
  v_go_on:
    "**-ing**: continue the same thing. **To + verb**: continue and start something new.",
};

const TRICKY_VERB_ORDER = [
  "v_remember",
  "v_stop",
  "v_forget",
  "v_try",
  "v_regret",
  "v_mean",
  "v_go_on",
];

const RELATED_LESSON_IDS = {
  pat_gerund: ["pat_infinitive", "pat_both_change", "pat_both_same"],
  pat_infinitive: ["pat_gerund", "pat_both_change", "pat_both_same"],
  pat_both_change: ["pat_both_same", "pat_gerund", "pat_infinitive"],
  pat_both_same: ["pat_both_change", "pat_gerund", "pat_infinitive"],
  pat_prep_gerund: ["pat_gerund"],
};

const VERB_PREVIEW_COUNT = 10;
const KEY_EXAMPLE_COUNT = 2;
const TRICKY_KEY_VERB_COUNT = 2;

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} lessonId
 */
function isBothChangeLesson(catalog, lessonId) {
  const p = catalog.patternsById[lessonId];
  return lessonId === PAT_BOTH_CHANGE || p?.learn_kind === "both_change";
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} lessonId
 */
function isBothSameLesson(catalog, lessonId) {
  const p = catalog.patternsById[lessonId];
  return lessonId === PAT_BOTH_SAME || p?.learn_kind === "both_same";
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} lessonId
 */
function isPrepGerundLesson(catalog, lessonId) {
  return catalog.patternsById[lessonId]?.learn_kind === "prep_gerund";
}

/** Order within a lesson: curated rank when present, then lemma. */
function sortVerbsForLearn(verbs) {
  return [...verbs].sort((a, b) => {
    const ra = a.source_rank ?? 9999;
    const rb = b.source_rank ?? 9999;
    if (ra !== rb) return ra - rb;
    return a.base_form.localeCompare(b.base_form);
  });
}

/** Match verb list order in long example lists (gerund / infinitive / both_same flat view). */
function sortExamplesByVerbRank(examples, catalog) {
  return [...examples].sort((a, b) => {
    const va = a.verb_id ? catalog.verbsById[a.verb_id] : null;
    const vb = b.verb_id ? catalog.verbsById[b.verb_id] : null;
    const ra = va?.source_rank ?? 9999;
    const rb = vb?.source_rank ?? 9999;
    if (ra !== rb) return ra - rb;
    return String(a.id).localeCompare(String(b.id));
  });
}

function verbsForLearnLesson(catalog, lessonId) {
  if (isPrepGerundLesson(catalog, lessonId)) {
    return [];
  }
  if (isBothSameLesson(catalog, lessonId)) {
    return sortVerbsForLearn(
      catalog.verbs.filter(
        (v) =>
          v.pattern_behavior === "both_same" &&
          v.pattern_usages?.includes(PAT_BOTH_SAME)
      )
    );
  }
  if (isBothChangeLesson(catalog, lessonId)) {
    return sortVerbsForLearn(catalog.verbs.filter((v) => v.pattern_behavior === "both_change"));
  }
  if (lessonId === "pat_gerund") {
    return sortVerbsForLearn(
      catalog.verbs.filter(
        (v) =>
          v.pattern_usages?.includes("pat_gerund") &&
          v.pattern_behavior === "only_gerund"
      )
    );
  }
  if (lessonId === "pat_infinitive") {
    return sortVerbsForLearn(
      catalog.verbs.filter(
        (v) =>
          v.pattern_usages?.includes("pat_infinitive") &&
          v.pattern_behavior === "only_infinitive"
      )
    );
  }
  return sortVerbsForLearn(catalog.verbs.filter((v) => v.pattern_usages?.includes(lessonId)));
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} lessonId
 */
function examplesForLearnLesson(catalog, lessonId) {
  if (isPrepGerundLesson(catalog, lessonId)) {
    return catalog.examples.filter((ex) => ex.pattern_id === lessonId);
  }
  if (isBothSameLesson(catalog, lessonId)) {
    return sortExamplesByVerbRank(
      catalog.examples.filter((ex) => ex.pattern_id === PAT_BOTH_SAME),
      catalog
    );
  }
  if (isBothChangeLesson(catalog, lessonId)) {
    const ids = new Set(
      catalog.verbs
        .filter((v) => v.pattern_behavior === "both_change")
        .map((v) => v.id)
    );
    return catalog.examples.filter((ex) => ids.has(ex.verb_id));
  }
  if (lessonId === "pat_gerund") {
    return sortExamplesByVerbRank(
      catalog.examples.filter((ex) => {
        if (ex.pattern_id !== "pat_gerund") return false;
        const v = catalog.verbsById[ex.verb_id];
        return v?.pattern_behavior === "only_gerund";
      }),
      catalog
    );
  }
  if (lessonId === "pat_infinitive") {
    return sortExamplesByVerbRank(
      catalog.examples.filter((ex) => {
        if (ex.pattern_id !== "pat_infinitive") return false;
        const v = catalog.verbsById[ex.verb_id];
        return v?.pattern_behavior === "only_infinitive";
      }),
      catalog
    );
  }
  return catalog.examples.filter((ex) => ex.pattern_id === lessonId);
}

function learnLessonCardModifiers(lessonId) {
  const mods = [];
  if (lessonId === "pat_gerund") mods.push("learn-lesson-card--start-here");
  if (lessonId === "pat_infinitive") mods.push("learn-lesson-card--core-chain");
  if (lessonId === PAT_BOTH_CHANGE) mods.push("learn-lesson-card--tricky");
  if (lessonId === PAT_BOTH_SAME) mods.push("learn-lesson-card--bonus");
  if (lessonId === "pat_prep_gerund") mods.push("learn-lesson-card--complement");
  return mods.join(" ");
}

function formatLearnPills(lessonId) {
  const pills = LEARN_CARD_PILLS[lessonId] || [];
  return pills
    .map(
      (p) =>
        `<span class="learn-lesson-card__pill learn-lesson-card__pill--${p.variant}">${escapeHtml(p.text)}</span>`
    )
    .join("");
}

/**
 * @param {object[]} examples
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
function groupExamplesByCollocation(examples, catalog) {
  /** @type {Map<string, object[]>} */
  const map = new Map();
  for (const ex of examples) {
    const id = ex.collocation_id;
    if (!id) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(ex);
  }
  return map;
}

function groupExamplesByVerb(examples, catalog) {
  /** @type {Map<string, object[]>} */
  const map = new Map();
  for (const ex of examples) {
    const id = ex.verb_id;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(ex);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => String(a.pattern_id).localeCompare(String(b.pattern_id)));
  }
  return map;
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
function buildPrepPhrasesCompactHtml(catalog) {
  const sorted = [...catalog.prepGerundCollocations].sort(
    (a, b) => a.sort_order - b.sort_order || String(a.id).localeCompare(String(b.id))
  );
  const bySub = new Map();
  for (const c of sorted) {
    if (!bySub.has(c.subcategory)) bySub.set(c.subcategory, []);
    bySub.get(c.subcategory).push(c);
  }
  /** @type {string[]} */
  const blocks = [];
  for (const sub of Object.keys(SUBCATEGORY_LABELS)) {
    const list = bySub.get(sub);
    if (!list?.length) continue;
    const label = SUBCATEGORY_LABELS[sub];
    const lis = list
      .map((c) => `<li class="learn-phrase-chip">${escapeHtml(c.display_phrase)}</li>`)
      .join("");
    blocks.push(
      `<div class="learn-prep-subgroup learn-prep-subgroup--compact">
        <h4 class="learn-prep-subgroup__title">${escapeHtml(label)}</h4>
        <ul class="learn-phrase-chip-list">${lis}</ul>
      </div>`
    );
  }
  return `<section class="learn-card" aria-labelledby="learn-phrases-h">
      <h3 id="learn-phrases-h" class="learn-card__heading">Phrases to learn as chunks</h3>
      <p class="learn-card__lede muted learn-prose learn-prose--inline">${feedbackBodyToHtml("Treat each line as **one piece** — then add **-ing** after the preposition part.")}</p>
      ${blocks.join("")}
    </section>`;
}

/**
 * @param {object} ex
 */
function exampleSentenceHtml(ex) {
  const { full } = formatSentenceParts(ex);
  const en = escapeHtml(full || "");
  const es = escapeHtml(ex.translation_es || "");
  return `<p class="learn-example-line__en">${en}</p>
    <p class="learn-example-line__es muted">${es}</p>`;
}

/**
 * @param {object} ex
 */
function exampleCharLength(ex) {
  const { full } = formatSentenceParts(ex);
  return (full || "").length;
}

/**
 * Shorter, clearer sentences first (recognition-friendly).
 * @param {object[]} examples
 */
function sortExamplesShortestFirst(examples) {
  return [...examples].sort((a, b) => exampleCharLength(a) - exampleCharLength(b));
}

/**
 * @param {string[]} keys
 */
function orderTrickyVerbKeys(keys) {
  const out = [];
  for (const id of TRICKY_VERB_ORDER) {
    if (keys.includes(id)) out.push(id);
  }
  for (const id of keys) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * @param {object[]} list
 * @param {string} patternId
 */
function pickShortestExampleByPattern(list, patternId) {
  const arr = list.filter((e) => e.pattern_id === patternId);
  if (!arr.length) return undefined;
  return arr.reduce((a, b) => (exampleCharLength(a) <= exampleCharLength(b) ? a : b));
}

/**
 * @param {object[]} examples
 * @param {number} count
 */
function splitExamplesPrimaryRest(examples, count) {
  return {
    primary: examples.slice(0, count),
    rest: examples.slice(count),
  };
}

/**
 * @param {Map<string, object[]>} grouped
 * @param {string[]} verbOrder
 */
/**
 * @param {Map<string, object[]>} grouped
 * @param {string[]} orderedVerbIds teaching order (e.g. from orderTrickyVerbKeys)
 */
function trickyVerbIdsPrimaryRest(grouped, orderedVerbIds, count) {
  const withPair = orderedVerbIds.filter((id) => {
    const list = grouped.get(id) || [];
    const hasG = list.some((e) => e.pattern_id === "pat_gerund");
    const hasI = list.some((e) => e.pattern_id === "pat_infinitive");
    return hasG && hasI;
  });
  const primary = withPair.slice(0, count);
  const restOrdered = withPair.slice(count);
  const onlyPartial = orderedVerbIds.filter((id) => !withPair.includes(id));
  return { primary, rest: [...restOrdered, ...onlyPartial] };
}

/**
 * @param {string} verbId
 * @param {Map<string, object[]>} grouped
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
function buildTrickyVerbCompareBlock(verbId, grouped, catalog) {
  const list = grouped.get(verbId) || [];
  const exG = pickShortestExampleByPattern(list, "pat_gerund");
  const exI = pickShortestExampleByPattern(list, "pat_infinitive");
  const v = catalog.verbsById[verbId];
  const name = escapeHtml(v?.base_form || verbId);
  const diffRaw = TRICKY_VERB_DIFF[verbId] || "Compare the two sentences: the idea changes.";
  const diffHtml = feedbackBodyToHtml(diffRaw);
  const cellG = exG
    ? `<div class="learn-tricky-pair__cell">
        <span class="learn-tricky-pair__label">verb + -ing</span>
        ${exampleSentenceHtml(exG)}
      </div>`
    : "";
  const cellI = exI
    ? `<div class="learn-tricky-pair__cell">
        <span class="learn-tricky-pair__label">verb + to + verb</span>
        ${exampleSentenceHtml(exI)}
      </div>`
    : "";
  return `<div class="learn-tricky-block">
    <div class="learn-tricky-block__verb">${name}</div>
    <div class="learn-tricky-pair">${cellG}${cellI}</div>
    <p class="learn-tricky-block__diff">${diffHtml}</p>
  </div>`;
}

function buildPrepGoodBadHtml() {
  const rows = [
    {
      ok: "She's interested in **learning** Japanese.",
      bad: "She's interested in **to learn** Japanese.",
      okEs: "Le interesa aprender japonés.",
      badEs: "(incorrect pattern)",
    },
    {
      ok: "Miguel is good at **fixing** bikes.",
      bad: "Miguel is good at **to fix** bikes.",
      okEs: "Miguel es bueno arreglando bicicletas.",
      badEs: "(incorrect pattern)",
    },
    {
      ok: "We left **after eating**.",
      bad: "We left **after eat**.",
      okEs: "Nos fuimos después de comer.",
      badEs: "(incorrect pattern)",
    },
  ];
  const lis = rows
    .map((r) => {
      return `<li class="learn-good-bad-row">
        <div class="learn-good-bad-row__ok">
          <span class="learn-good-bad-row__tag" aria-hidden="true">✓</span>
          <div>
            <p class="learn-good-bad-row__line">${feedbackBodyToHtml(r.ok)}</p>
            <p class="learn-good-bad-row__es muted">${escapeHtml(r.okEs)}</p>
          </div>
        </div>
        <div class="learn-good-bad-row__bad">
          <span class="learn-good-bad-row__tag learn-good-bad-row__tag--bad" aria-hidden="true">✗</span>
          <div>
            <p class="learn-good-bad-row__line learn-good-bad-row__line--bad">${feedbackBodyToHtml(r.bad)}</p>
            <p class="learn-good-bad-row__es muted">${escapeHtml(r.badEs)}</p>
          </div>
        </div>
      </li>`;
    })
    .join("");
  return `<section class="learn-card learn-card--border-strong" aria-labelledby="learn-goodbad-h">
    <h3 id="learn-goodbad-h" class="learn-card__heading">Quick check: right vs wrong</h3>
    <p class="learn-card__lede muted learn-prose learn-prose--inline">${feedbackBodyToHtml("After **in / on / at / after** (or phrases like **interested in**), the next verb is **-ing** — **not** **to + verb**.")}</p>
    <ul class="learn-good-bad-list">${lis}</ul>
  </section>`;
}

/**
 * @param {string} href
 * @param {string} label
 * @param {string} hintHtml
 * @param {string} [extraClass]
 */
function buildPracticeCtaHtml(href, label, hintHtml, extraClass = "") {
  const cls = ["learn-cta", "learn-cta--lesson", extraClass].filter(Boolean).join(" ");
  return `<div class="${cls}">
    <a class="btn btn--primary learn-cta__btn" href="${href}">${escapeHtml(label)}</a>
    <p class="learn-cta__hint muted">${hintHtml}</p>
  </div>`;
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} currentId
 */
function buildRelatedLessonsHtml(catalog, currentId) {
  const ids = (RELATED_LESSON_IDS[currentId] || []).filter((id) => catalog.patternsById[id]);
  if (!ids.length) return "";
  const links = ids
    .map((id) => {
      const p = catalog.patternsById[id];
      return `<li class="learn-related-compact__item">
        <a class="learn-related-compact__link" href="#/learn/${escapeHtml(p.id)}">${escapeHtml(p.name)}</a>
      </li>`;
    })
    .join("");
  return `<nav class="learn-related-compact" aria-label="Related lessons">
    <p class="learn-related-compact__label">Also compare</p>
    <ul class="learn-related-compact__list">${links}</ul>
  </nav>`;
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} patternId
 * @param {object} pattern
 */
function buildLearnLessonArticleHtml(catalog, patternId, pattern) {
  const bothChangeLesson = isBothChangeLesson(catalog, patternId);
  const bothSameLesson = isBothSameLesson(catalog, patternId);
  const groupedVerbExamplesLesson = bothChangeLesson || bothSameLesson;
  const prepLesson = isPrepGerundLesson(catalog, patternId);
  const verbs = verbsForLearnLesson(catalog, patternId);
  let examples = examplesForLearnLesson(catalog, patternId);
  if (!bothChangeLesson && !prepLesson) {
    examples = sortExamplesShortestFirst(examples);
  }

  const practiceHref = bothChangeLesson
    ? "#/practice/tricky"
    : prepLesson
      ? "#/practice/practice/pat_prep_gerund"
      : `#/practice/practice/${patternId}`;
  const practiceLabel = bothChangeLesson ? "Practice tricky verbs" : "Practice this lesson";

  const tagsHtml = `<div class="learn-lesson-page__tags" aria-label="Lesson type">${formatLearnPills(patternId)}</div>`;

  const pedagogyTitle = escapeHtml(LESSON_HERO_TITLE[patternId] || pattern.name);
  const formula = escapeHtml(LESSON_FORMULA[patternId] || pattern.name);
  const quickLineHtml = feedbackBodyToHtml(LESSON_QUICK_LINE[patternId] || "");

  const miniExList = bothChangeLesson ? sortExamplesShortestFirst(examples) : examples;
  const miniEx = miniExList[0];
  const miniExampleBlock = miniEx
    ? `<div class="learn-rule-hero__mini" aria-label="Quick example">
        <span class="learn-rule-hero__mini-label">Quick look</span>
        ${exampleSentenceHtml(miniEx)}
      </div>`
    : "";

  const bothSameCallout = bothSameLesson
    ? `<div class="learn-callout learn-callout--positive" role="note">
        <strong>This is the relaxed lesson:</strong> <strong>-ing</strong> or <strong>to + verb</strong> usually both work, and the <strong>meaning</strong> stays <strong>about the same</strong> — unlike <strong>Tricky verbs</strong>.
      </div>`
    : "";

  const noticeCardHtml = `<section class="learn-card learn-card--notice" aria-labelledby="learn-notice-h">
      <h3 id="learn-notice-h" class="learn-card__heading">What to notice</h3>
      <div class="learn-card__body learn-prose">${feedbackBodyToHtml(LESSON_WHAT_TO_NOTICE[patternId] || "")}</div>
    </section>`;

  const ruleCardHtml = `<section class="learn-card learn-card--rule" aria-labelledby="learn-rule-h">
      <h3 id="learn-rule-h" class="learn-card__heading">The rule (remember this)</h3>
      <div class="learn-card__body learn-prose">${feedbackBodyToHtml(pattern.summary || "")}</div>
    </section>`;

  const noticeAndRuleRow = `<div class="learn-lesson-row2">
    <div class="learn-lesson-row2__col">${noticeCardHtml}</div>
    <div class="learn-lesson-row2__col">${ruleCardHtml}</div>
  </div>`;

  const contrastBody = pattern.contrast_note
    ? `<section class="learn-card learn-card--contrast" aria-labelledby="learn-contrast-h">
        <h3 id="learn-contrast-h" class="learn-card__heading">Don’t confuse this with</h3>
        <p class="learn-card__lede muted learn-prose learn-prose--inline">${feedbackBodyToHtml("This box **separates** this lesson from the others — read it once, then you’ll know **which lesson** you need.")}</p>
        <div class="learn-card__body learn-prose">${feedbackBodyToHtml(pattern.contrast_note)}</div>
      </section>`
    : "";

  const examplesLede = `<p class="learn-card__lede muted learn-prose learn-prose--inline">${feedbackBodyToHtml(LESSON_EXAMPLES_LEDE[patternId] || "")}</p>`;

  let keyExamplesSection = "";
  let moreExamplesDetails = "";

  if (prepLesson && examples.length) {
    const { primary, rest } = splitExamplesPrimaryRest(examples, KEY_EXAMPLE_COUNT);
    const primaryLis = primary.map((ex) => `<li class="learn-example-feature">${exampleSentenceHtml(ex)}</li>`).join("");
    keyExamplesSection = `<section class="learn-card" aria-labelledby="learn-keyex-h">
        <h3 id="learn-keyex-h" class="learn-card__heading">Examples that show the pattern</h3>
        ${examplesLede}
        <ol class="learn-example-feature-list">${primaryLis}</ol>
      </section>`;
    if (rest.length) {
      const grouped = groupExamplesByCollocation(rest, catalog);
      const order = [...catalog.prepGerundCollocations].sort(
        (a, b) => a.sort_order - b.sort_order || String(a.id).localeCompare(String(b.id))
      );
      let inner = "";
      for (const col of order) {
        const list = grouped.get(col.id) || [];
        if (!list.length) continue;
        const items = list
          .map((ex) => `<li class="learn-example-more__item">${exampleSentenceHtml(ex)}</li>`)
          .join("");
        inner += `<div class="learn-example-more__group">
          <h4 class="learn-example-more__group-title">${escapeHtml(col.display_phrase)}</h4>
          <ul class="learn-example-more__list">${items}</ul>
        </div>`;
      }
      moreExamplesDetails = `<details class="learn-details">
        <summary class="learn-details__summary">More examples (${rest.length})</summary>
        <div class="learn-details__body">${inner}</div>
      </details>`;
    }
  } else if (bothChangeLesson && examples.length) {
    const grouped = groupExamplesByVerb(examples, catalog);
    const verbOrder = verbs.map((v) => v.id);
    const keys = verbOrder.filter((id) => grouped.has(id));
    for (const id of grouped.keys()) {
      if (!keys.includes(id)) keys.push(id);
    }
    const orderedTrickyKeys = orderTrickyVerbKeys(keys);
    const { primary: primIds, rest: restIds } = trickyVerbIdsPrimaryRest(
      grouped,
      orderedTrickyKeys,
      TRICKY_KEY_VERB_COUNT
    );
    const primaryBlocks = primIds.map((id) => buildTrickyVerbCompareBlock(id, grouped, catalog)).join("");
    keyExamplesSection = `<section class="learn-card" aria-labelledby="learn-keyex-h">
        <h3 id="learn-keyex-h" class="learn-card__heading">Examples that show the pattern</h3>
        ${examplesLede}
        <div class="learn-tricky-stack">${primaryBlocks}</div>
      </section>`;
    if (restIds.length) {
      const restBlocks = restIds.map((id) => buildTrickyVerbCompareBlock(id, grouped, catalog)).join("");
      moreExamplesDetails = `<details class="learn-details">
        <summary class="learn-details__summary">More verbs (${restIds.length})</summary>
        <div class="learn-details__body learn-tricky-stack">${restBlocks}</div>
      </details>`;
    }
  } else if (groupedVerbExamplesLesson && examples.length) {
    const grouped = groupExamplesByVerb(examples, catalog);
    const verbOrder = verbs.map((v) => v.id);
    const keys = verbOrder.filter((id) => grouped.has(id));
    for (const id of grouped.keys()) {
      if (!keys.includes(id)) keys.push(id);
    }
    const flat = [];
    for (const vid of keys) {
      for (const ex of grouped.get(vid) || []) flat.push(ex);
    }
    const flatSorted = sortExamplesShortestFirst(flat);
    const { primary, rest } = splitExamplesPrimaryRest(flatSorted, KEY_EXAMPLE_COUNT);
    const primaryLis = primary
      .map((ex) => `<li class="learn-example-feature">${exampleSentenceHtml(ex)}</li>`)
      .join("");
    keyExamplesSection = `<section class="learn-card" aria-labelledby="learn-keyex-h">
        <h3 id="learn-keyex-h" class="learn-card__heading">Examples that show the pattern</h3>
        ${examplesLede}
        <ol class="learn-example-feature-list">${primaryLis}</ol>
      </section>`;
    if (rest.length) {
      const restLis = rest.map((ex) => `<li class="learn-example-more__item">${exampleSentenceHtml(ex)}</li>`).join("");
      moreExamplesDetails = `<details class="learn-details">
        <summary class="learn-details__summary">More examples (${rest.length})</summary>
        <ul class="learn-example-more__list">${restLis}</ul>
      </details>`;
    }
  } else if (examples.length) {
    const { primary, rest } = splitExamplesPrimaryRest(examples, KEY_EXAMPLE_COUNT);
    const primaryLis = primary
      .map((ex) => `<li class="learn-example-feature">${exampleSentenceHtml(ex)}</li>`)
      .join("");
    keyExamplesSection = `<section class="learn-card" aria-labelledby="learn-keyex-h">
        <h3 id="learn-keyex-h" class="learn-card__heading">Examples that show the pattern</h3>
        ${examplesLede}
        <ol class="learn-example-feature-list">${primaryLis}</ol>
      </section>`;
    if (rest.length) {
      const restLis = rest.map((ex) => `<li class="learn-example-more__item">${exampleSentenceHtml(ex)}</li>`).join("");
      moreExamplesDetails = `<details class="learn-details">
        <summary class="learn-details__summary">More examples (${rest.length})</summary>
        <ul class="learn-example-more__list">${restLis}</ul>
      </details>`;
    }
  } else {
    keyExamplesSection = `<section class="learn-card" aria-labelledby="learn-keyex-h">
        <h3 id="learn-keyex-h" class="learn-card__heading">Examples that show the pattern</h3>
        <p class="muted">No examples for this lesson yet.</p>
      </section>`;
  }

  const ctaHint =
    "When this feels clear, open <strong>Practice</strong> — same patterns, nothing saved.";
  const practiceAside = buildPracticeCtaHtml(
    practiceHref,
    practiceLabel,
    ctaHint,
    "learn-cta--sidebar"
  );

  let verbsSection = "";
  if (!prepLesson && !bothChangeLesson && verbs.length) {
    const preview = verbs.slice(0, VERB_PREVIEW_COUNT);
    const more = verbs.slice(VERB_PREVIEW_COUNT);
    const previewLis = preview
      .map(
        (v) =>
          `<li class="learn-verb-compact__item"><strong>${escapeHtml(v.base_form)}</strong> <span class="muted">${escapeHtml(v.translation_es || "")}</span></li>`
      )
      .join("");
    const moreLis = more
      .map(
        (v) =>
          `<li class="learn-verb-compact__item"><strong>${escapeHtml(v.base_form)}</strong> <span class="muted">${escapeHtml(v.translation_es || "")}</span></li>`
      )
      .join("");
    const moreBlock =
      more.length > 0
        ? `<details class="learn-details learn-details--verbs">
            <summary class="learn-details__summary">More verbs (${more.length})</summary>
            <ul class="learn-verb-compact__list learn-verb-compact__list--more">${moreLis}</ul>
          </details>`
        : "";
    verbsSection = `<section class="learn-card learn-card--aside-block" aria-labelledby="learn-verbs-h">
        <h3 id="learn-verbs-h" class="learn-card__heading">Common verbs</h3>
        <p class="learn-card__lede muted learn-prose learn-prose--inline">${feedbackBodyToHtml("High-frequency verbs first — use the list to **recognize**, not to memorize everything tonight.")}</p>
        <ul class="learn-verb-compact__list">${previewLis}</ul>
        ${moreBlock}
      </section>`;
  } else if (bothChangeLesson) {
    const names = verbs.map((v) => escapeHtml(v.base_form)).join(" · ");
    verbsSection = names
      ? `<section class="learn-card learn-card--muted learn-card--aside-block" aria-labelledby="learn-verbs-h">
          <h3 id="learn-verbs-h" class="learn-card__heading">Verbs in this lesson</h3>
          <p class="learn-verb-chips" lang="en">${names}</p>
        </section>`
      : "";
  }

  const prepGoodBad = prepLesson ? buildPrepGoodBadHtml() : "";
  const prepPhrasesOnly = prepLesson ? buildPrepPhrasesCompactHtml(catalog) : "";

  const relatedHtml = buildRelatedLessonsHtml(catalog, patternId);

  const heroHtml = `<section class="learn-card learn-rule-hero learn-rule-hero--compact" aria-label="This lesson in one glance">
      ${bothSameCallout}
      <h2 class="learn-rule-hero__pedagogy">${pedagogyTitle}</h2>
      <p class="learn-rule-hero__formula" lang="en">${formula}</p>
      <p class="learn-rule-hero__line">${quickLineHtml}</p>
      ${miniExampleBlock}
    </section>`;

  const primaryColumn = `${heroHtml}
    ${noticeAndRuleRow}
    ${keyExamplesSection}
    ${moreExamplesDetails}
    ${prepGoodBad}
    ${contrastBody}
    ${prepPhrasesOnly}`;

  const secondaryColumn = `${practiceAside}
    ${verbsSection}
    ${relatedHtml}`;

  return `<article class="learn-lesson-page learn-detail-article">
    <header class="learn-lesson-page__header">
      <h1 class="learn-detail-article__title learn-lesson-page__title">${escapeHtml(pattern.name)}</h1>
      ${tagsHtml}
    </header>
    <div class="learn-lesson-page__split">
      <div class="learn-lesson-page__primary">${primaryColumn}</div>
      <aside class="learn-lesson-page__secondary" aria-label="Reference and practice">${secondaryColumn}</aside>
    </div>
  </article>`;
}

/**
 * Learn index: static guided path (no saved progress), path card, pedagogical cards.
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
function buildLearnIndexInnerHtml(catalog) {
  const orderIds = LEARN_INDEX_ORDER.filter((id) => catalog.patternsById[id]);

  const pathSteps = orderIds
    .map((id, index) => {
      const label = catalog.patternsById[id]?.name || id;
      return `<li class="learn-path-card__item"><span class="learn-path-card__num">${index + 1}</span><span class="learn-path-card__label">${escapeHtml(label)}</span></li>`;
    })
    .join("");

  const breadcrumbHtml = `<nav class="learn-breadcrumb learn-breadcrumb--in-sidebar" aria-label="Breadcrumb">
        <ol class="learn-breadcrumb__list">
          <li class="learn-breadcrumb__item"><a href="#/home">Home</a></li>
          <li class="learn-breadcrumb__item learn-breadcrumb__item--current" aria-current="page">Learn</li>
        </ol>
      </nav>`;

  const parts = [];

  parts.push(`<div class="learn-index-grid">
  <aside class="learn-index-sidebar">
    ${breadcrumbHtml}
    <div class="learn-hero">
    <h1 class="learn-hero__title" id="learn-index-page-title">Learn verb patterns</h1>
    <p class="learn-hero__subtitle">Learn one pattern at a time. Read the rule, see examples, then practice the same idea in <strong>Practice</strong>.</p>
  </div>

  <section class="learn-path-card learn-path-card--compact" aria-labelledby="learn-path-heading">
    <h2 id="learn-path-heading" class="learn-path-card__title">Recommended order</h2>
    <ol class="learn-path-card__list">${pathSteps}</ol>
    <p class="learn-path-card__footnote muted">Follow 1 → 5 for the gentlest path. You can open any lesson in any order if you prefer.</p>
  </section>
  <a class="btn btn--ghost learn-index-sidebar__practice" href="#/practice">Go to Practice</a>
  </aside>

  <div class="learn-index-main">
  <header class="learn-lessons-head">
    <h2 class="learn-lessons-section-title">Lessons</h2>
    <p class="learn-lessons-section-lead muted">Open a card for the rule and examples. <strong>Start here</strong> on lesson 1.</p>
  </header>
  <div class="learn-lesson-list" role="list">`);

  for (let index = 0; index < orderIds.length; index++) {
    const id = orderIds[index];
    const p = catalog.patternsById[id];
    if (!p) continue;
    const descHtml = feedbackBodyToHtml(LEARN_CARD_DESCRIPTIONS[id] || "");
    const metaLine = LEARN_CARD_META[id] || "";
    const pillsHtml = formatLearnPills(id);
    const modClass = learnLessonCardModifiers(id);

    const badge = `<span class="learn-lesson-card__badge learn-lesson-card__badge--num" aria-hidden="true">${index + 1}</span>`;

    const cardClasses = ["learn-lesson-card", modClass].filter(Boolean).join(" ");

    parts.push(`<a class="${cardClasses}" role="listitem" href="#/learn/${escapeHtml(p.id)}">
      ${badge}
      <span class="learn-lesson-card__body">
        <span class="learn-lesson-card__head">
          <span class="learn-lesson-card__title-row">
            <span class="learn-lesson-card__title">${escapeHtml(p.name)}</span>
          </span>
          <span class="learn-lesson-card__pills">${pillsHtml}</span>
        </span>
        <p class="learn-lesson-card__desc">${descHtml}</p>
        <p class="learn-lesson-card__meta">${escapeHtml(metaLine)}</p>
      </span>
      ${ICON_CHEVRON}
    </a>`);
  }

  parts.push(`</div>
  </div>
</div>`);

  return parts.join("");
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string|undefined} patternId
 */
export function mountLearn(root, catalog, patternId) {
  root.innerHTML = patternId
    ? `
    <div class="learn-layout">
      <header class="learn-view-head">
      <nav class="learn-breadcrumb" aria-label="Breadcrumb">
        <ol class="learn-breadcrumb__list">
          <li class="learn-breadcrumb__item"><a href="#/home">Home</a></li>
          <li class="learn-breadcrumb__item learn-breadcrumb__item--current" aria-current="page">Learn</li>
        </ol>
      </nav>
      </header>
      <div class="learn-body"></div>
    </div>
  `
    : `
    <div class="learn-layout learn-layout--index">
      <div class="learn-body learn-body--index"></div>
    </div>
  `;

  const body = root.querySelector(".learn-body");
  if (!body) return;

  if (!patternId) {
    body.innerHTML = buildLearnIndexInnerHtml(catalog);
    return;
  }

  const pattern = catalog.patternsById[patternId];
  if (!pattern) {
    body.innerHTML = `<p class="error">Unknown lesson.</p>`;
    return;
  }

  const header = root.querySelector(".learn-view-head");
  if (header) {
    header.innerHTML = `
      <nav class="learn-breadcrumb" aria-label="Breadcrumb">
        <ol class="learn-breadcrumb__list">
          <li class="learn-breadcrumb__item"><a href="#/home">Home</a></li>
          <li class="learn-breadcrumb__item"><a href="#/learn">Learn</a></li>
          <li class="learn-breadcrumb__item learn-breadcrumb__item--current" aria-current="page">${escapeHtml(pattern.name)}</li>
        </ol>
      </nav>`;
  }

  body.innerHTML = buildLearnLessonArticleHtml(catalog, patternId, pattern);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

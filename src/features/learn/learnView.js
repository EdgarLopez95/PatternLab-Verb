import { navigate } from "../../app/router.js";
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

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} lessonId
 */
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

/**
 * @param {object[]} examples
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
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

function patternLabelForExample(patternId) {
  if (patternId === "pat_gerund") return "-ing form";
  if (patternId === "pat_infinitive") return "to + verb";
  if (patternId === PAT_BOTH_SAME) return "-ing or to + verb";
  return String(patternId);
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} hintHtml unescaped HTML (same convention as other learn hints)
 */
function buildPrepPhrasesSectionHtml(catalog, hintHtml) {
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
      .map((c) => `<li><strong>${escapeHtml(c.display_phrase)}</strong></li>`)
      .join("");
    blocks.push(
      `<div class="learn-prep-subgroup">
        <h4 class="learn-prep-subgroup__title">${escapeHtml(label)}</h4>
        <ul class="verb-list">${lis}</ul>
      </div>`
    );
  }
  return `<section class="learn-section">
      <h3 class="learn-section__title">Phrases to learn</h3>
      <p class="muted learn-hint">${hintHtml}</p>
      ${blocks.join("")}
    </section>`;
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string|undefined} patternId
 */
export function mountLearn(root, catalog, patternId) {
  root.innerHTML = `
    <div class="view-head">
      <button type="button" class="btn btn--ghost back-btn">Home</button>
      <h1 class="view-title">Learn</h1>
    </div>
    <div class="learn-body"></div>
  `;

  root.querySelector(".back-btn")?.addEventListener("click", () => navigate("#/home"));

  const body = root.querySelector(".learn-body");
  if (!body) return;

  if (!patternId) {
    const n = LEARN_INDEX_ORDER.filter((id) => catalog.patternsById[id]).length;
    body.innerHTML = `<p class="muted"><strong>${n} lessons.</strong> Start with <strong>Verb + -ing</strong> and <strong>Verb + to + verb</strong>, then <strong>Tricky verbs</strong>. <strong>Both forms (same idea)</strong> is extra. Last: <strong>-ing</strong> after small words like <em>in</em> or <em>after</em>.</p>
      <ul class="pattern-list"></ul>`;
    const ul = body.querySelector(".pattern-list");
    for (const id of LEARN_INDEX_ORDER) {
      const p = catalog.patternsById[id];
      if (!p) continue;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#/learn/${p.id}`;
      a.textContent = p.name;
      li.appendChild(a);
      ul?.appendChild(li);
    }
    return;
  }

  const pattern = catalog.patternsById[patternId];
  if (!pattern) {
    body.innerHTML = `<p class="error">Unknown lesson.</p>`;
    return;
  }

  const bothChangeLesson = isBothChangeLesson(catalog, patternId);
  const bothSameLesson = isBothSameLesson(catalog, patternId);
  const groupedVerbExamplesLesson = bothChangeLesson || bothSameLesson;
  const prepLesson = isPrepGerundLesson(catalog, patternId);
  const verbs = verbsForLearnLesson(catalog, patternId);

  const verbSectionTitle = prepLesson
    ? "Useful phrases"
    : bothChangeLesson
      ? "Tricky verbs in this lesson"
      : "Verbs in this lesson";

  const verbHint = prepLesson
    ? "The important part is often a <strong>small word</strong> or <strong>short phrase</strong> (<em>interested in</em>, <em>after</em>). After that you usually use <strong>-ing</strong>. This is not the same as <strong>Verb + -ing</strong> in the other lessons."
    : bothChangeLesson
      ? "These verbs can be followed by <strong>-ing</strong> or <strong>to + verb</strong>, but the meaning changes. Compare the example pairs below."
      : bothSameLesson
        ? "These verbs often work with <strong>-ing</strong> <strong>or</strong> <strong>to + verb</strong>. The idea stays <strong>similar</strong>. This is <strong>not</strong> the same as <strong>Tricky verbs (two forms)</strong>."
        : patternId === "pat_gerund"
        ? "These verbs are followed by <strong>-ing</strong> in this course. Verbs that also allow <strong>to + verb</strong> with a different meaning are in <strong>Tricky verbs</strong>. Verbs where <strong>both</strong> forms are OK with a <strong>similar</strong> idea are in <strong>Both forms (same idea)</strong>."
        : patternId === "pat_infinitive"
          ? "These verbs are followed by <strong>to + verb</strong> in this course. Verbs that also use <strong>-ing</strong> with a different meaning are in <strong>Tricky verbs</strong>. Verbs where <strong>both</strong> forms are OK with a <strong>similar</strong> idea are in <strong>Both forms (same idea)</strong>."
          : "These verbs are in this lesson.";

  const verbHintWithNav =
    verbHint +
    (!prepLesson && verbs.length > 25
      ? " The list is ordered by teaching priority (curated rank), top to bottom."
      : "");

  const verbLines = prepLesson
    ? ""
    : verbs
        .map((v) => {
          return `<li><strong>${escapeHtml(v.base_form)}</strong> — <span class="muted">${escapeHtml(
            v.translation_es || ""
          )}</span></li>`;
        })
        .join("");

  const prepPhrasesSectionHtml = prepLesson
    ? buildPrepPhrasesSectionHtml(catalog, verbHint)
    : "";

  const patternExplanationHtml = `<section class="learn-section learn-section--pattern">
      <h3 class="learn-section__title">How it works</h3>
      <p class="pattern-structure">${escapeHtml(pattern.structure)}</p>
      ${
        pattern.summary
          ? `<div class="learn-prose learn-prose--inline">${feedbackBodyToHtml(pattern.summary)}</div>`
          : ""
      }
    </section>`;

  const contrastTitle = bothChangeLesson ? "Quick contrasts" : "Other lessons";
  const contrastSection =
    pattern.contrast_note
      ? `<section class="learn-section learn-section--contrast">
        <h3 class="learn-section__title">${escapeHtml(contrastTitle)}</h3>
        <div class="learn-prose">${feedbackBodyToHtml(pattern.contrast_note)}</div>
      </section>`
      : "";

  const examples = examplesForLearnLesson(catalog, patternId);

  let examplesHtml = "";
  if (prepLesson && examples.length) {
    const grouped = groupExamplesByCollocation(examples, catalog);
    const order = [...catalog.prepGerundCollocations].sort(
      (a, b) => a.sort_order - b.sort_order || String(a.id).localeCompare(String(b.id))
    );
    for (const col of order) {
      const list = grouped.get(col.id) || [];
      if (!list.length) continue;
      const items = list
        .map((ex) => {
          const { full } = formatSentenceParts(ex);
          return `<li class="example-item">
            <p class="example-en">${escapeHtml(full || "")}</p>
            <p class="example-es">${escapeHtml(ex.translation_es || "")}</p>
          </li>`;
        })
        .join("");
      examplesHtml += `<section class="learn-verb-group">
        <h4 class="learn-verb-group__title">${escapeHtml(col.display_phrase)}</h4>
        <ul class="example-list">${items}</ul>
      </section>`;
    }
  } else if (groupedVerbExamplesLesson && examples.length) {
    const grouped = groupExamplesByVerb(examples, catalog);
    const verbOrder = verbs.map((v) => v.id);
    const keys = verbOrder.filter((id) => grouped.has(id));
    for (const id of grouped.keys()) {
      if (!keys.includes(id)) keys.push(id);
    }
    for (const vid of keys) {
      const list = grouped.get(vid) || [];
      const v = catalog.verbsById[vid];
      const title = v?.base_form || vid;
      const items = list
        .map((ex) => {
          const { full } = formatSentenceParts(ex);
          const pl = patternLabelForExample(ex.pattern_id);
          return `<li class="example-item">
            <p class="example-tag muted">${escapeHtml(pl)}</p>
            <p class="example-en">${escapeHtml(full || "")}</p>
            <p class="example-es">${escapeHtml(ex.translation_es || "")}</p>
          </li>`;
        })
        .join("");
      examplesHtml += `<section class="learn-verb-group">
        <h4 class="learn-verb-group__title">${escapeHtml(title)}</h4>
        <ul class="example-list">${items}</ul>
      </section>`;
    }
  } else {
    const lines = examples
      .map((ex) => {
        const { full } = formatSentenceParts(ex);
        return `<li class="example-item">
          <p class="example-en">${escapeHtml(full || "")}</p>
          <p class="example-es">${escapeHtml(ex.translation_es || "")}</p>
        </li>`;
      })
      .join("");
    examplesHtml = `<ul class="example-list">${lines}</ul>`;
  }

  const practiceHref = bothChangeLesson
    ? "#/practice/tricky"
    : prepLesson
      ? "#/practice/practice/pat_prep_gerund"
      : `#/practice/practice/${patternId}`;
  const practiceLabel = bothChangeLesson
    ? "Practice tricky verbs"
    : prepLesson
      ? "Practice this lesson"
      : "Practice this lesson";

  const examplesSection =
    examples.length === 0
      ? `<section class="learn-section">
          <h3 class="learn-section__title">Examples</h3>
          <p class="muted">No examples for this lesson yet.</p>
        </section>`
      : `<section class="learn-section">
          <h3 class="learn-section__title">Examples</h3>
          ${examplesHtml}
        </section>`;

  body.innerHTML = `
    <nav class="breadcrumb"><a href="#/learn">Back to all lessons</a></nav>
    <article class="pattern-detail">
      <h2>${escapeHtml(pattern.name)}</h2>
      ${patternExplanationHtml}
      ${examplesSection}
      ${
        prepLesson
          ? prepPhrasesSectionHtml
          : `<section class="learn-section">
        <h3 class="learn-section__title">${escapeHtml(verbSectionTitle)}</h3>
        <p class="muted learn-hint">${verbHintWithNav}</p>
        <ul class="verb-list">${verbLines || "<li class=\"muted\">No verbs listed yet.</li>"}</ul>
      </section>`
      }
      ${contrastSection}
      <div class="learn-cta">
        <a class="btn btn--primary learn-cta__btn" href="${practiceHref}">${escapeHtml(practiceLabel)}</a>
      </div>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

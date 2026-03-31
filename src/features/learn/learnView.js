import { navigate } from "../../app/router.js";
import { formatSentenceParts } from "../../shared/formatSentence.js";
import { feedbackBodyToHtml } from "../../shared/feedbackFormat.js";

/** Pedagogical order on the Learn index (must match pattern ids in data). */
const LEARN_INDEX_ORDER = ["pat_gerund", "pat_infinitive", "pat_both_change"];

const PAT_BOTH_CHANGE = "pat_both_change";

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
function verbsForLearnLesson(catalog, lessonId) {
  if (isBothChangeLesson(catalog, lessonId)) {
    return catalog.verbs.filter((v) => v.pattern_behavior === "both_change");
  }
  if (lessonId === "pat_gerund") {
    return catalog.verbs.filter(
      (v) =>
        v.pattern_usages?.includes("pat_gerund") &&
        v.pattern_behavior === "only_gerund"
    );
  }
  if (lessonId === "pat_infinitive") {
    return catalog.verbs.filter(
      (v) =>
        v.pattern_usages?.includes("pat_infinitive") &&
        v.pattern_behavior === "only_infinitive"
    );
  }
  return catalog.verbs.filter((v) => v.pattern_usages?.includes(lessonId));
}

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string} lessonId
 */
function examplesForLearnLesson(catalog, lessonId) {
  if (isBothChangeLesson(catalog, lessonId)) {
    const ids = new Set(
      catalog.verbs
        .filter((v) => v.pattern_behavior === "both_change")
        .map((v) => v.id)
    );
    return catalog.examples.filter((ex) => ids.has(ex.verb_id));
  }
  if (lessonId === "pat_gerund") {
    return catalog.examples.filter((ex) => {
      if (ex.pattern_id !== "pat_gerund") return false;
      const v = catalog.verbsById[ex.verb_id];
      return v?.pattern_behavior === "only_gerund";
    });
  }
  if (lessonId === "pat_infinitive") {
    return catalog.examples.filter((ex) => {
      if (ex.pattern_id !== "pat_infinitive") return false;
      const v = catalog.verbsById[ex.verb_id];
      return v?.pattern_behavior === "only_infinitive";
    });
  }
  return catalog.examples.filter((ex) => ex.pattern_id === lessonId);
}

/**
 * @param {object[]} examples
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
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
  if (patternId === "pat_gerund") return "Gerund (-ing)";
  if (patternId === "pat_infinitive") return "To-infinitive";
  return String(patternId);
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
    body.innerHTML = `<p class="muted">Three lessons: gerund-only verbs, infinitive-only verbs, and tricky verbs where <strong>-ing</strong> vs <strong>to</strong> changes the meaning.</p>
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

  const bothLesson = isBothChangeLesson(catalog, patternId);
  const verbs = verbsForLearnLesson(catalog, patternId);

  const verbSectionTitle = bothLesson
    ? "Tricky verbs in this lesson"
    : "Common verbs with this pattern";

  const verbHint = bothLesson
    ? "These verbs can be followed by <strong>-ing</strong> or <strong>to + verb</strong>, but the meaning changes. Compare the example pairs below."
    : patternId === "pat_gerund"
      ? "These verbs are followed by <strong>-ing</strong> in this course. Verbs that also allow <strong>to + verb</strong> with a different meaning are in <strong>Tricky verbs</strong>."
      : patternId === "pat_infinitive"
        ? "These verbs are followed by <strong>to + verb</strong> in this course. Verbs that also use <strong>-ing</strong> with a different meaning are in <strong>Tricky verbs</strong>."
        : "Verbs that belong to this lesson in the course list.";

  const verbLines = verbs
    .map((v) => {
      return `<li><strong>${escapeHtml(v.base_form)}</strong> — <span class="muted">${escapeHtml(
        v.translation_es || ""
      )}</span></li>`;
    })
    .join("");

  const patternExplanationHtml = `<section class="learn-section learn-section--pattern">
      <h3 class="learn-section__title">About this pattern</h3>
      <p class="pattern-structure">${escapeHtml(pattern.structure)}</p>
      ${
        pattern.summary
          ? `<div class="learn-prose learn-prose--inline">${feedbackBodyToHtml(pattern.summary)}</div>`
          : ""
      }
    </section>`;

  const contrastTitle = bothLesson ? "Tricky contrasts" : "Related patterns";
  const contrastSection =
    pattern.contrast_note
      ? `<section class="learn-section learn-section--contrast">
        <h3 class="learn-section__title">${escapeHtml(contrastTitle)}</h3>
        <div class="learn-prose">${feedbackBodyToHtml(pattern.contrast_note)}</div>
      </section>`
      : "";

  const examples = examplesForLearnLesson(catalog, patternId);

  let examplesHtml = "";
  if (bothLesson && examples.length) {
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

  const practiceHref = bothLesson ? "#/practice/tricky" : `#/practice/practice/${patternId}`;
  const practiceLabel = bothLesson ? "Practice tricky verbs" : "Practice this pattern";

  const examplesSection =
    examples.length === 0
      ? `<section class="learn-section">
          <h3 class="learn-section__title">Examples</h3>
          <p class="muted">No examples in the dataset for this lesson yet.</p>
        </section>`
      : `<section class="learn-section">
          <h3 class="learn-section__title">Examples</h3>
          ${examplesHtml}
        </section>`;

  body.innerHTML = `
    <nav class="breadcrumb"><a href="#/learn">All lessons</a></nav>
    <article class="pattern-detail">
      <h2>${escapeHtml(pattern.name)}</h2>
      ${patternExplanationHtml}
      ${examplesSection}
      <section class="learn-section">
        <h3 class="learn-section__title">${escapeHtml(verbSectionTitle)}</h3>
        <p class="muted learn-hint">${verbHint}</p>
        <ul class="verb-list">${verbLines || "<li class=\"muted\">No verbs in this lesson yet.</li>"}</ul>
      </section>
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

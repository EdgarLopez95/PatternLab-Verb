/**
 * Home: compact — hierarchy mostly visual; each instructional idea appears once.
 */

const HOME_ICONS = {
  learn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  practice: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  mixed: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
  speed: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
};

/** @typedef {{ title: string; desc: string; href: string; badge?: string; icon: keyof typeof HOME_ICONS }} HomeStudyCard */

/** @typedef {{ title: string; desc: string; href: string; badge?: string; icon: keyof typeof HOME_ICONS; primary?: boolean }} HomePracticeCard */

const STUDY_CARDS = /** @type {HomeStudyCard[]} */ ([
  {
    title: "Verbs + -ing",
    desc: "Like enjoy reading, finish eating.",
    href: "#/learn/pat_gerund",
    icon: "learn",
  },
  {
    title: "Verbs + to + verb",
    desc: "Like want to go, hope to see.",
    href: "#/learn/pat_infinitive",
    icon: "learn",
  },
]);

const PRACTICE_CARDS = /** @type {HomePracticeCard[]} */ ([
  {
    title: "Practice with questions",
    desc: "Step by step, with feedback.",
    href: "#/practice/practice",
    icon: "practice",
    primary: true,
    badge: "Start here",
  },
  {
    title: "Mixed review",
    desc: "All groups mixed together.",
    href: "#/practice/mixed",
    icon: "mixed",
    badge: "Mixed",
  },
  {
    title: "Speed drill",
    desc: "Quick taps, beat the clock.",
    href: "#/practice/speed",
    icon: "speed",
    badge: "Timed",
  },
]);

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
export function renderHome(root, catalog) {
  const title = catalog.settings?.ui?.appTitle || "PatternLab Verbs";

  root.innerHTML = `
    <div class="home-layout">
      <div class="home-hero home-hero--compact">
        <h1 class="app-title">${escapeHtml(title)}</h1>
        <p class="app-tagline">Short lessons on verb patterns. Then try the quizzes.</p>
        <div class="home-hero__actions">
          <a class="btn btn--primary home-hero__cta" href="#/learn">All lessons</a>
        </div>
      </div>
      <main class="home-main" id="home-main-content" aria-label="Learning paths"></main>
    </div>
  `;

  const main = root.querySelector("#home-main-content");
  if (!main) return;

  const studySection = document.createElement("section");
  studySection.className = "home-section home-section--study";
  studySection.id = "home-study";
  studySection.setAttribute("aria-labelledby", "home-study-heading");
  studySection.innerHTML = `
    <header class="home-section__header-block home-section__header-block--tight">
      <h2 class="home-section__heading" id="home-study-heading">Study verb groups</h2>
      <p class="home-section__intro home-section__intro--inline">Start with <strong>-ing</strong> or <strong>to + verb</strong>.</p>
    </header>
    <ul class="home-study-grid"></ul>
  `;
  const studyGrid = studySection.querySelector(".home-study-grid");
  for (const card of STUDY_CARDS) {
    const li = document.createElement("li");
    li.className = "home-study-grid__item";
    li.appendChild(createStudyCardLink(card));
    studyGrid?.appendChild(li);
  }

  const alsoLi = document.createElement("li");
  alsoLi.className = "home-study-grid__item home-study-grid__item--also";
  const alsoLink = document.createElement("a");
  alsoLink.className = "home-quick-extra home-study-also";
  alsoLink.href = "#/learn/pat_both_same";
  alsoLink.innerHTML = "Also study: <strong>Verbs + both</strong>";
  alsoLi.appendChild(alsoLink);
  studyGrid?.appendChild(alsoLi);

  const meaningLi = document.createElement("li");
  meaningLi.className = "home-study-grid__item home-study-grid__item--secondary";
  meaningLi.appendChild(createMeaningBlock());
  studyGrid?.appendChild(meaningLi);

  main.appendChild(studySection);

  const quickSection = document.createElement("section");
  quickSection.className = "home-section home-section--quick-links";
  quickSection.setAttribute("aria-label", "Extra lesson");
  quickSection.innerHTML = `
    <a class="home-quick-extra" href="#/learn/pat_prep_gerund">Also: <strong>in</strong> / <strong>without</strong> + <strong>-ing</strong></a>
  `;
  main.appendChild(quickSection);

  const practiceSection = document.createElement("section");
  practiceSection.className = "home-section home-section--practice";
  practiceSection.setAttribute("aria-labelledby", "home-practice-heading");
  practiceSection.innerHTML = `
    <header class="home-section__header-block home-section__header-block--tight">
      <h2 class="home-section__heading" id="home-practice-heading">Practice</h2>
    </header>
    <ul class="home-grid home-grid--practice"></ul>
  `;
  const practiceGrid = practiceSection.querySelector(".home-grid--practice");
  for (const card of PRACTICE_CARDS) {
    const li = document.createElement("li");
    li.className = "home-grid__item";
    li.appendChild(createPracticeCardLink(card));
    practiceGrid?.appendChild(li);
  }
  main.appendChild(practiceSection);
}

/**
 * @param {HomeStudyCard} card
 */
function createStudyCardLink(card) {
  const a = document.createElement("a");
  a.href = card.href;
  a.className = "mode-card mode-card--link home-study-card mode-card--study-pillar";
  const iconHtml = HOME_ICONS[card.icon] || HOME_ICONS.learn;
  const tagHtml = card.badge
    ? `<span class="mode-card__tag">${escapeHtml(card.badge)}</span>`
    : "";
  a.innerHTML = `
    <span class="mode-card__icon-wrap">${iconHtml}</span>
    <span class="mode-card__body">
      <span class="mode-card__title">${escapeHtml(card.title)}</span>
      <span class="mode-card__desc">${escapeHtml(card.desc)}</span>
      ${tagHtml}
    </span>`;
  return a;
}

/** One bordered block: lesson + optional practice (same visual unit). */
function createMeaningBlock() {
  const block = document.createElement("div");
  block.className = "home-meaning-block";
  const iconHtml = HOME_ICONS.learn;
  block.innerHTML = `
    <a class="home-meaning-block__lesson mode-card mode-card--link" href="#/learn/pat_both_change">
      <span class="mode-card__icon-wrap">${iconHtml}</span>
      <span class="mode-card__body">
        <span class="mode-card__title">Meaning changes</span>
        <span class="mode-card__desc">Same verb, different ideas.</span>
      </span>
    </a>
    <a class="home-meaning-block__practice" href="#/practice/tricky">Practice this group only →</a>
  `;
  return block;
}

/**
 * @param {HomePracticeCard} card
 */
function createPracticeCardLink(card) {
  const a = document.createElement("a");
  a.href = card.href;
  const tierClass = card.primary ? "mode-card--practice-primary" : "";
  a.className = ["mode-card", "mode-card--link", "home-practice-card", "mode-card--compact-home", tierClass]
    .filter(Boolean)
    .join(" ");
  const iconHtml = HOME_ICONS[card.icon] || HOME_ICONS.practice;
  const tagHtml = card.badge
    ? `<span class="mode-card__tag">${escapeHtml(card.badge)}</span>`
    : "";
  a.innerHTML = `
    <span class="mode-card__icon-wrap">${iconHtml}</span>
    <span class="mode-card__body">
      <span class="mode-card__title">${escapeHtml(card.title)}</span>
      <span class="mode-card__desc">${escapeHtml(card.desc)}</span>
      ${tagHtml}
    </span>`;
  return a;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

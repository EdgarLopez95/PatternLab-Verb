import { navigate } from "../../app/router.js";

/** @typedef {{ label: string; desc: string; hash: string; tag: string; icon: keyof typeof HOME_ICONS }} HomeMode */

const HOME_ICONS = {
  learn: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  practice: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  tricky: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  mixed: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
  speed: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
};

const SECTION_ICONS = {
  start: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  quiz: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
};

/**
 * @param {HTMLElement} container
 * @param {string} sectionTitle
 * @param {HomeMode[]} modes
 * @param {keyof typeof SECTION_ICONS | null} sectionIconKey
 */
function appendModeSection(container, sectionTitle, modes, sectionIconKey = null) {
  const section = document.createElement("section");
  section.className = "home-section";

  const head = document.createElement("div");
  head.className = "home-section__head";

  if (sectionIconKey && SECTION_ICONS[sectionIconKey]) {
    const iconWrap = document.createElement("span");
    iconWrap.className = "home-section__icon";
    iconWrap.innerHTML = SECTION_ICONS[sectionIconKey];
    head.appendChild(iconWrap);
  }

  const h2 = document.createElement("h2");
  h2.className = "home-section__title";
  h2.textContent = sectionTitle;
  head.appendChild(h2);
  section.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "home-grid";

  for (const m of modes) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mode-card";
    const iconHtml = HOME_ICONS[m.icon] || HOME_ICONS.learn;
    card.innerHTML = `
      <span class="mode-card__icon-wrap">${iconHtml}</span>
      <span class="mode-card__body">
        <span class="mode-card__title">${escapeHtml(m.label)}</span>
        <span class="mode-card__desc">${escapeHtml(m.desc)}</span>
        <span class="mode-card__tag">${escapeHtml(m.tag)}</span>
      </span>`;
    card.addEventListener("click", () => navigate(m.hash));
    grid.appendChild(card);
  }

  section.appendChild(grid);
  container.appendChild(section);
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
export function renderHome(root, catalog) {
  const title = catalog.settings?.ui?.appTitle || "PatternLab Verbs";

  root.innerHTML = `
    <div class="home-hero">
      <h1 class="app-title">${escapeHtml(title)}</h1>
      <p class="app-tagline">Memorize which verbs take <strong>-ing</strong>, <strong>to + verb</strong>, or <strong>both</strong> depending on meaning. Choose a module to start practicing.</p>
    </div>
    <main class="home-main" aria-label="Modes"></main>
  `;

  const main = root.querySelector(".home-main");
  if (!main) return;

  /** @type {HomeMode[]} */
  const coreModes = [
    {
      label: "Learn",
      desc: "Master the core rules of when to use gerunds (-ing) or infinitives (to + verb).",
      hash: "#/learn",
      tag: "Fundamentals",
      icon: "learn",
    },
    {
      label: "Practice",
      desc: "Apply your knowledge of -ing and to + verb patterns in structured exercises.",
      hash: "#/practice/practice",
      tag: "Application",
      icon: "practice",
    },
    {
      label: "Tricky verbs",
      desc: "Focus on verbs that change meaning depending on if they take -ing or to + verb.",
      hash: "#/practice/tricky",
      tag: "Exceptions",
      icon: "tricky",
    },
  ];

  /** @type {HomeMode[]} */
  const extraModes = [
    {
      label: "Mixed exam",
      desc: "Test your memory with a random mix of all gerund and infinitive patterns.",
      hash: "#/practice/mixed",
      tag: "Assessment",
      icon: "mixed",
    },
    {
      label: "Speed drill",
      desc: "Quickly identify if a verb takes -ing, to + verb, or both under time pressure.",
      hash: "#/practice/speed",
      tag: "Agility",
      icon: "speed",
    },
  ];

  appendModeSection(main, "Start here", coreModes, "start");
  appendModeSection(main, "Quiz & speed", extraModes, "quiz");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

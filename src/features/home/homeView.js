import { navigate } from "../../app/router.js";

/** @typedef {{ label: string; desc: string; hash: string }} HomeMode */

/**
 * @param {HTMLElement} container
 * @param {string} sectionTitle
 * @param {HomeMode[]} modes
 */
function appendModeSection(container, sectionTitle, modes) {
  const section = document.createElement("section");
  section.className = "home-section";

  const h2 = document.createElement("h2");
  h2.className = "home-section__title";
  h2.textContent = sectionTitle;

  const grid = document.createElement("div");
  grid.className = "home-grid";

  for (const m of modes) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mode-card";
    card.innerHTML = `<span class="mode-card__title">${escapeHtml(m.label)}</span>
      <span class="mode-card__desc">${escapeHtml(m.desc)}</span>`;
    card.addEventListener("click", () => navigate(m.hash));
    grid.appendChild(card);
  }

  section.appendChild(h2);
  section.appendChild(grid);
  container.appendChild(section);
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
export function renderHome(root, catalog) {
  const title =
    catalog.settings?.ui?.appTitle || "PatternLab Verbs";

  root.innerHTML = `
    <header class="app-header">
      <h1 class="app-title">${escapeHtml(title)}</h1>
      <p class="app-tagline">Memorize which verbs take <strong>-ing</strong>, <strong>to + verb</strong>, or <strong>both</strong> depending on meaning.</p>
    </header>
    <main class="home-main" aria-label="Modes"></main>
  `;

  const main = root.querySelector(".home-main");
  if (!main) return;

  /** @type {HomeMode[]} */
  const coreModes = [
    {
      label: "Learn",
      desc: "Rules, example sentences, and verb lists by pattern",
      hash: "#/learn",
    },
    {
      label: "Practice",
      desc: "Broad review: every pattern and exercise type, shuffled",
      hash: "#/practice/practice",
    },
    {
      label: "Tricky verbs",
      desc: "Focus on verbs where -ing vs to changes the meaning",
      hash: "#/practice/tricky",
    },
  ];

  /** @type {HomeMode[]} */
  const extraModes = [
    {
      label: "Mixed exam",
      desc: "Test-style mix: extra weight on tricky items and rotating formats",
      hash: "#/practice/mixed",
    },
    {
      label: "Speed drill",
      desc: "Build fluency under time (multiple choice and fill-in only)",
      hash: "#/practice/speed",
    },
  ];

  appendModeSection(main, "Start here", coreModes);
  appendModeSection(main, "Exam & speed", extraModes);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

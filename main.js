import { bootstrap } from "./src/app/bootstrap.js";

const THEME_KEY = "patternlab-theme";

function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* ignore */
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute(
    "data-theme",
    theme === "dark" ? "dark" : "light"
  );
  try {
    localStorage.setItem(THEME_KEY, theme === "dark" ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const sync = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  };
  btn.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    sync();
  });
  sync();
}

applyTheme(getPreferredTheme());
initThemeToggle();

bootstrap().catch((err) => {
  console.error(err);
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `<div class="error-card">
      <h1>Could not load</h1>
      <p>${String(err.message || err)}</p>
      <p class="muted">Tip: open this app with a local server (for example <code>npx serve .</code>) so JSON files can load.</p>
    </div>`;
  }
});

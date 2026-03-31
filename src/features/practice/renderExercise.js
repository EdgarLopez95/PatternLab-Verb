export { feedbackBodyToHtml } from "../../shared/feedbackFormat.js";

/** @param {HTMLElement} container @param {object} model */
export function renderExerciseStem(container, model) {
  container.innerHTML = "";

  if (model.kind === "verb_behavior") {
    const v = model.verb;
    const p = document.createElement("p");
    p.className = "stem stem--verb";
    p.innerHTML = `<strong>${escapeHtml(v.base_form)}</strong> <span class="muted">(${
      v.translation_es ? escapeHtml(v.translation_es) : ""
    })</span>`;
    p.appendChild(document.createElement("br"));
    const q = document.createElement("span");
    q.textContent =
      "Does this verb usually take -ing or to + verb after it?";
    p.appendChild(q);
    container.appendChild(p);
    return;
  }

  const { prefix, suffix, placeholder } = model.sentence;
  const wrap = document.createElement("p");
  wrap.className = "stem stem--gap";
  wrap.appendChild(document.createTextNode(prefix));
  if (model.kind === "fill" && model.blankLemma) {
    const lem = document.createElement("span");
    lem.className = "stem-blank-lemma muted";
    lem.textContent = `(${model.blankLemma}) `;
    lem.setAttribute(
      "aria-label",
      `Base verb to use: ${model.blankLemma}`
    );
    wrap.appendChild(lem);
  }
  const gap = document.createElement("span");
  gap.className = "gap";
  gap.textContent = placeholder || "____";
  wrap.appendChild(gap);
  wrap.appendChild(document.createTextNode(suffix));
  container.appendChild(wrap);
}

/** @param {HTMLElement} container */
export function clearChoices(container) {
  container.innerHTML = "";
}

/**
 * @param {HTMLElement} actions host for buttons
 * @param {{ value: string; label: string }[]} choices
 * @param {(value: string) => void} onPick
 */
export function renderMultipleChoice(actions, choices, onPick) {
  actions.innerHTML = "";
  for (const c of choices) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--choice";
    btn.textContent = c.label;
    btn.addEventListener("click", () => onPick(c.value));
    actions.appendChild(btn);
  }
}

/**
 * @param {HTMLElement} formHost
 * @param {(value: string) => void} onSubmit
 * @param {{ placeholder?: string }} [opts]
 */
export function renderFillBlank(formHost, onSubmit, opts = {}) {
  formHost.innerHTML = "";
  const root = document.createElement("div");
  root.className = "fill-blank-actions";

  const wrap = document.createElement("div");
  wrap.className = "fill-row";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "input-text";
  input.autocomplete = "off";
  input.setAttribute("aria-label", "Your answer");
  if (opts.placeholder) input.placeholder = opts.placeholder;

  const hintId = `fill-hint-${Math.random().toString(36).slice(2, 9)}`;
  const hint = document.createElement("p");
  hint.className = "fill-inline-hint";
  hint.id = hintId;
  hint.setAttribute("role", "alert");
  hint.hidden = true;
  hint.textContent = "Type your answer first.";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--primary";
  btn.textContent = "Check";

  function hasNonEmptyAnswer() {
    return input.value.trim().length > 0;
  }

  function syncCheckEnabled() {
    btn.disabled = !hasNonEmptyAnswer();
    if (hasNonEmptyAnswer()) {
      hint.hidden = true;
      input.removeAttribute("aria-describedby");
    }
  }

  function trySubmit() {
    if (!hasNonEmptyAnswer()) {
      hint.hidden = false;
      input.setAttribute("aria-describedby", hintId);
      return;
    }
    hint.hidden = true;
    input.removeAttribute("aria-describedby");
    onSubmit(input.value);
  }

  btn.addEventListener("click", trySubmit);
  input.addEventListener("input", syncCheckEnabled);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      trySubmit();
    }
  });

  wrap.appendChild(input);
  wrap.appendChild(btn);
  root.appendChild(wrap);
  root.appendChild(hint);
  formHost.appendChild(root);

  btn.disabled = true;
  queueMicrotask(() => input.focus());
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
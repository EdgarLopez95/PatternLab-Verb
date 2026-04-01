import { navigate } from "../../app/router.js";
import { resolveExerciseForView } from "../../domain/resolveExercise.js";
import { validateAnswer } from "../../domain/validateAnswer.js";
import { pickNextExerciseId } from "../../domain/exercisePicker.js";
import {
  renderExerciseStem,
  renderMultipleChoice,
  renderFillBlank,
  clearChoices,
  feedbackBodyToHtml,
} from "./renderExercise.js";
import { PATTERN_BEHAVIOR_LABELS } from "../../shared/patternBehaviorLabels.js";
import { labelForExerciseType } from "../../shared/exerciseTypeLabels.js";
import { getPracticeUiSettings } from "./practiceUiSettings.js";

const MODE_LABELS = {
  practice: "Practice",
  tricky: "Tricky verbs",
  mixed: "Mixed quiz",
};

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {'practice'|'tricky'|'mixed'} mode
 * @param {string|null} [patternIdFilter]
 */
export function mountPractice(root, catalog, mode, patternIdFilter = null) {
  const shuffleOptions =
    mode === "mixed"
      ? catalog.settings?.mixed?.shuffleOptions !== false
      : catalog.settings?.practice?.shuffleOptions !== false;

  const filterOpts = patternIdFilter ? { patternId: patternIdFilter } : {};

  const patternBanner =
    patternIdFilter && catalog.patternsById[patternIdFilter]
      ? `<p class="pattern-filter-banner muted" role="status">Practicing: <strong>${escapeHtml(
          catalog.patternsById[patternIdFilter].name
        )}</strong></p>`
      : "";

  root.innerHTML = `
    <div class="view-head view-head--split">
      <button type="button" class="btn btn--ghost back-btn">Home</button>
      <div class="view-head__center">
        <h1 class="view-title">${escapeHtml(MODE_LABELS[mode] || "Practice")}</h1>
        ${patternBanner}
        <p class="practice-anchor-line muted" data-practice-anchor hidden></p>
        <p class="practice-score-line muted" data-practice-score hidden aria-live="polite"></p>
      </div>
    </div>
    <main class="practice-main">
      <section class="card exercise-card" data-phase="answering" aria-live="polite">
        <div class="practice-region practice-region--question">
          <p class="exercise-type-kicker muted" data-exercise-type aria-hidden="true"></p>
          <h2 class="region-label" id="question-region-label">Question</h2>
          <div class="stem-host"></div>
          <div class="hint-host" data-hint-host hidden>
            <button type="button" class="btn btn--ghost hint-btn">Show hint</button>
            <p class="hint-preview muted" data-hint-preview hidden></p>
          </div>
        </div>
        <div class="practice-region practice-region--answer">
          <h2 class="region-label region-label--answer" id="answer-region-label">Your answer</h2>
          <p class="session-stats muted" data-session-stats hidden></p>
          <div class="actions-host"></div>
        </div>
        <div
          class="practice-region practice-region--result feedback-host"
          id="practice-feedback-panel"
          hidden
        >
          <h2 class="region-label">Result</h2>
          <div class="feedback-inner"></div>
        </div>
        <div class="nav-host">
          <div class="review-bar" data-review-bar hidden>
            <p class="review-bar__status" data-review-status aria-live="polite"></p>
            <div class="review-bar__row">
              <button type="button" class="btn btn--primary next-btn" hidden>
                Next question
              </button>
              <div class="review-bar__feedback-slot">
                <button
                  type="button"
                  class="btn btn--ghost review-bar__see-feedback"
                  data-show-feedback-btn
                  hidden
                  aria-expanded="false"
                  aria-controls="practice-feedback-panel"
                >
                  See feedback
                </button>
                <span class="review-bar__invite muted" data-feedback-invite hidden>
                  Optional — notes and correct answer
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;

  const back = root.querySelector(".back-btn");
  const card = root.querySelector(".exercise-card");
  const stemHost = root.querySelector(".stem-host");
  const actionsHost = root.querySelector(".actions-host");
  const feedbackHost = root.querySelector(".feedback-host");
  const feedbackInner = root.querySelector(".feedback-inner");
  const nextBtn = root.querySelector(".next-btn");
  const reviewBar = root.querySelector("[data-review-bar]");
  const reviewStatusEl = root.querySelector("[data-review-status]");
  const showFeedbackBtn = root.querySelector("[data-show-feedback-btn]");
  const feedbackInviteEl = root.querySelector("[data-feedback-invite]");
  const practiceScoreEl = root.querySelector("[data-practice-score]");
  const practiceAnchorEl = root.querySelector("[data-practice-anchor]");
  const typeKicker = root.querySelector("[data-exercise-type]");
  const questionLabelEl = root.querySelector("#question-region-label");
  const answerLabelEl = root.querySelector("#answer-region-label");
  const hintHost = root.querySelector("[data-hint-host]");
  const hintBtn = root.querySelector(".hint-btn");
  const hintPreview = root.querySelector("[data-hint-preview]");
  const sessionStatsEl = root.querySelector("[data-session-stats]");

  back?.addEventListener("click", () => navigate("#/home"));

  if (
    !stemHost ||
    !actionsHost ||
    !feedbackHost ||
    !feedbackInner ||
    !nextBtn ||
    !card ||
    !reviewBar ||
    !reviewStatusEl ||
    !showFeedbackBtn
  ) {
    return;
  }

  const pickerState = { recentIds: [], mixedTypeIndex: 0 };
  const bufferSize = catalog.settings?.selection?.recentBufferSize ?? 4;

  const sessionStats = { correctCount: 0, incorrectCount: 0, hintRevealCount: 0 };

  /** @type {'mc'|'fill'|'verb_behavior'|null} */
  let currentInteractionKind = null;

  /** @type {((ev: KeyboardEvent) => void) | null} */
  let enterAdvanceHandler = null;

  function removeEnterAdvance() {
    if (enterAdvanceHandler) {
      window.removeEventListener("keydown", enterAdvanceHandler);
      enterAdvanceHandler = null;
    }
  }

  function updateSessionStatsEl() {
    if (!sessionStatsEl) return;
    if (!getPracticeUiSettings(catalog).showSessionStats) {
      sessionStatsEl.hidden = true;
      return;
    }
    sessionStatsEl.hidden = false;
    sessionStatsEl.textContent = `${sessionStats.incorrectCount} incorrect · ${sessionStats.hintRevealCount} tips (this session)`;
  }

  function updatePracticeScoreLine() {
    if (!practiceScoreEl) return;
    if (!getPracticeUiSettings(catalog).showPracticeScoreCounters) {
      practiceScoreEl.hidden = true;
      return;
    }
    practiceScoreEl.hidden = false;
    practiceScoreEl.textContent = `Correct: ${sessionStats.correctCount} · Incorrect: ${sessionStats.incorrectCount}`;
  }

  let currentId = pickNextExerciseId(
    catalog,
    mode,
    null,
    pickerState,
    filterOpts
  );

  /**
   * @param {{ correct: boolean }} result
   * @param {object} exercise
   * @param {boolean} timedOut
   * @param {{ userAnswerDisplay?: string | null; isMcFeedback?: boolean }} [opts]
   */
  function setFeedback(result, exercise, timedOut, opts = {}) {
    const { userAnswerDisplay = null, isMcFeedback = false } = opts;
    card.setAttribute("data-phase", "reviewed");
    card.classList.add("exercise-card--answered");
    feedbackHost.hidden = true;
    showFeedbackBtn.hidden = false;
    showFeedbackBtn.setAttribute("aria-expanded", "false");
    showFeedbackBtn.textContent = "See feedback";
    if (feedbackInviteEl) feedbackInviteEl.hidden = false;
    reviewBar.hidden = false;

    const fb = catalog.feedbackById[exercise.feedback_id];
    const genOk = catalog.feedbackById["fb_generic_correct"];
    const genBad = catalog.feedbackById["fb_generic_incorrect"];

    const title = timedOut
      ? "Time's up"
      : result.correct
        ? genOk?.title || "Correct"
        : genBad?.title || "Incorrect";

    const shortLine = timedOut
      ? `<p class="feedback-lead">${escapeHtml(genBad?.body || "Too slow. Try the next one.")}</p>`
      : result.correct
        ? `<p class="feedback-lead">${feedbackBodyToHtml(genOk?.body || "Nice.")}</p>`
        : `<p class="feedback-lead">${feedbackBodyToHtml(genBad?.body || "")}</p>`;

    const explanationBlock =
      fb && (fb.title || fb.body || (fb.hint && !timedOut))
        ? `<div class="feedback-block feedback-block--explain">
         <h3 class="feedback-block__title">Explanation</h3>
         ${fb.title ? `<p class="feedback-title-inline">${escapeHtml(fb.title)}</p>` : ""}
         <div class="feedback-body">${feedbackBodyToHtml(fb.body || "")}</div>
         ${fb.hint && !timedOut ? `<p class="hint"><em>${escapeHtml(fb.hint)}</em></p>` : ""}
       </div>`
        : "";

    const exRef = exercise.example_id
      ? catalog.examplesById[exercise.example_id]
      : null;
    const translationBlock = exRef?.translation_es
      ? `<div class="feedback-block feedback-block--translation">
         <h3 class="feedback-block__title">Translation</h3>
         <p class="translation">${escapeHtml(exRef.translation_es)}</p>
       </div>`
        : "";

    const keyLabel =
      exercise.type === "verb_pattern_behavior"
        ? PATTERN_BEHAVIOR_LABELS[exercise.correct_answer] ||
          String(exercise.correct_answer)
        : String(exercise.correct_answer);

    const showMcCompare =
      isMcFeedback && userAnswerDisplay != null && !timedOut;

    const answerSummaryBlock = showMcCompare
      ? `<div class="feedback-compare feedback-compare--mc" role="group" aria-label="Your answer and correct answer">
      <div class="feedback-compare__col">
        <h3 class="feedback-compare__heading">Your answer</h3>
        <p class="feedback-compare__text">${escapeHtml(userAnswerDisplay)}</p>
      </div>
      <div class="feedback-compare__col">
        <h3 class="feedback-compare__heading">Correct answer</h3>
        <p class="feedback-compare__text feedback-compare__text--key">${escapeHtml(keyLabel)}</p>
      </div>
    </div>`
      : `<div class="feedback-block feedback-block--answer">
      <h3 class="feedback-block__title">Correct answer</h3>
      <p class="answer-key">${escapeHtml(keyLabel)}</p>
    </div>`;

    const statusClass =
      timedOut || !result.correct ? "feedback--bad" : "feedback--ok";

    const detailParts = [shortLine, explanationBlock, translationBlock].filter(
      Boolean
    );
    const hasDetails = detailParts.length > 0;
    const detailsPanelId = `feedback-details-${exercise.id}`;

    const toggleExpand = isMcFeedback ? "Learn the rule" : "View explanation";
    const toggleCollapse = isMcFeedback ? "Hide" : "Hide explanation";
    const toggleClass = isMcFeedback
      ? "btn btn--ghost feedback-details-toggle feedback-details-toggle--mc"
      : "btn btn--ghost feedback-details-toggle";

    feedbackInner.innerHTML = `
      <div class="feedback ${statusClass}${
        isMcFeedback ? " feedback--mc" : ""
      }">
        <div class="feedback-summary">
          <p class="result-title">${escapeHtml(title)}</p>
          ${answerSummaryBlock}
        </div>
        ${
          hasDetails
            ? `<button type="button" class="${toggleClass}" aria-expanded="false" aria-controls="${escapeHtml(detailsPanelId)}">
          ${escapeHtml(toggleExpand)}
        </button>
        <div id="${escapeHtml(detailsPanelId)}" class="feedback-details" hidden>
          ${detailParts.join("")}
        </div>`
            : ""
        }
      </div>
    `;

    const toggleBtn = feedbackInner.querySelector(".feedback-details-toggle");
    const detailsEl = feedbackInner.querySelector(".feedback-details");
    if (toggleBtn && detailsEl) {
      toggleBtn.addEventListener("click", () => {
        const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
        const next = !expanded;
        detailsEl.hidden = !next;
        toggleBtn.setAttribute("aria-expanded", String(next));
        toggleBtn.textContent = next ? toggleCollapse : toggleExpand;
      });
    }

    reviewStatusEl.textContent = title;
    reviewStatusEl.classList.remove(
      "review-bar__status--ok",
      "review-bar__status--bad"
    );
    if (!timedOut && result.correct) {
      reviewStatusEl.classList.add("review-bar__status--ok");
    } else {
      reviewStatusEl.classList.add("review-bar__status--bad");
    }

    showFeedbackBtn.onclick = () => {
      const open = feedbackHost.hidden;
      feedbackHost.hidden = !open;
      showFeedbackBtn.setAttribute("aria-expanded", String(open));
      showFeedbackBtn.textContent = open ? "Hide feedback" : "See feedback";
      if (feedbackInviteEl) feedbackInviteEl.hidden = open;
      if (open) {
        queueMicrotask(() => {
          const smooth =
            typeof matchMedia === "function" &&
            matchMedia("(prefers-reduced-motion: no-preference)").matches;
          feedbackHost.scrollIntoView({
            behavior: smooth ? "smooth" : "auto",
            block: "nearest",
          });
        });
      }
    };
  }

  function disableActions() {
    actionsHost.querySelectorAll("button, input").forEach((el) => {
      el.setAttribute("disabled", "disabled");
    });
    if (hintBtn) hintBtn.setAttribute("disabled", "disabled");
  }

  /** @param {object} exercise @param {string} userValue @param {boolean} timedOut */
  function markMcChoiceOutcome(exercise, userValue, timedOut) {
    if (card.dataset.exerciseKind !== "mc" || timedOut) return;
    const correct = String(exercise.correct_answer);
    const picked = String(userValue);
    actionsHost.querySelectorAll(".btn--choice").forEach((btn) => {
      btn.classList.remove(
        "btn--choice--picked",
        "btn--choice--outcome-correct",
        "btn--choice--outcome-wrong",
        "btn--choice--outcome-idle"
      );
      const v = btn.dataset.choiceValue ?? "";
      if (v === correct) btn.classList.add("btn--choice--outcome-correct");
      else if (v === picked && picked !== correct)
        btn.classList.add("btn--choice--outcome-wrong");
      else btn.classList.add("btn--choice--outcome-idle");
    });
  }

  /** @param {string} userValue @param {boolean} timedOut */
  function onAnswer(userValue, timedOut = false) {
    removeEnterAdvance();
    const exercise = catalog.exercisesById[currentId];
    const result = timedOut
      ? { correct: false }
      : validateAnswer(exercise, userValue);
    if (result.correct && !timedOut) sessionStats.correctCount += 1;
    if (!result.correct) sessionStats.incorrectCount += 1;
    updateSessionStatsEl();
    updatePracticeScoreLine();
    disableActions();
    markMcChoiceOutcome(exercise, userValue, timedOut);
    const isMcFeedback = currentInteractionKind === "mc";
    setFeedback(result, exercise, timedOut, {
      userAnswerDisplay: timedOut ? null : userValue,
      isMcFeedback,
    });
    nextBtn.hidden = false;
    queueMicrotask(() => nextBtn?.focus());

    const adv = getPracticeUiSettings(catalog).enterToAdvanceOnCorrect;
    if (
      adv &&
      result.correct &&
      !timedOut &&
      currentInteractionKind === "fill"
    ) {
      enterAdvanceHandler = (ev) => {
        if (ev.key !== "Enter" || ev.repeat) return;
        if (card.getAttribute("data-phase") !== "reviewed") return;
        ev.preventDefault();
        nextBtn.click();
      };
      window.addEventListener("keydown", enterAdvanceHandler);
    }
  }

  function bindExercise(id) {
    removeEnterAdvance();
    currentId = id;
    feedbackHost.hidden = true;
    feedbackInner.innerHTML = "";
    nextBtn.hidden = true;
    if (reviewBar) reviewBar.hidden = true;
    if (reviewStatusEl) {
      reviewStatusEl.textContent = "";
      reviewStatusEl.classList.remove(
        "review-bar__status--ok",
        "review-bar__status--bad"
      );
    }
    if (showFeedbackBtn) {
      showFeedbackBtn.hidden = true;
      showFeedbackBtn.onclick = null;
      showFeedbackBtn.setAttribute("aria-expanded", "false");
      showFeedbackBtn.textContent = "See feedback";
    }
    if (feedbackInviteEl) feedbackInviteEl.hidden = true;
    card.setAttribute("data-phase", "answering");
    card.classList.remove("exercise-card--answered");
    clearChoices(actionsHost);

    const exercise = catalog.exercisesById[id];
    const model = resolveExerciseForView(catalog, id, shuffleOptions);
    card.dataset.exerciseKind = model.kind;

    if (typeKicker) {
      if (model.kind === "mc") {
        typeKicker.textContent = "Choose the correct form";
        typeKicker.classList.remove("muted");
        typeKicker.classList.add("exercise-type-kicker--mc-lead");
      } else {
        typeKicker.textContent = exercise
          ? labelForExerciseType(exercise.type)
          : "";
        typeKicker.classList.add("muted");
        typeKicker.classList.remove("exercise-type-kicker--mc-lead");
      }
      typeKicker.setAttribute("aria-hidden", "false");
    }
    if (questionLabelEl) {
      questionLabelEl.textContent =
        model.kind === "mc" ? "Complete the sentence" : "Question";
    }
    if (answerLabelEl) {
      answerLabelEl.textContent =
        model.kind === "mc" ? "Choose one answer" : "Your answer";
    }

    if (hintHost) hintHost.hidden = true;
    if (hintPreview) {
      hintPreview.hidden = true;
      hintPreview.textContent = "";
    }
    if (hintBtn) {
      hintBtn.removeAttribute("disabled");
      if (model.kind === "mc") {
        hintBtn.className = "btn hint-btn hint-btn--as-tip";
        hintBtn.textContent = "Need help?";
      } else {
        hintBtn.className = "btn btn--ghost hint-btn";
        hintBtn.textContent = "Show hint";
      }
    }

    const fbPre = exercise
      ? catalog.feedbackById[exercise.feedback_id]
      : null;
    if (hintHost && hintBtn && hintPreview && fbPre?.hint) {
      hintHost.hidden = false;
      hintBtn.onclick = () => {
        sessionStats.hintRevealCount += 1;
        updateSessionStatsEl();
        hintPreview.textContent = fbPre.hint;
        hintPreview.hidden = false;
        hintBtn.setAttribute("disabled", "disabled");
      };
    }
    if (practiceAnchorEl) {
      if (model.collocation?.display_phrase) {
        practiceAnchorEl.hidden = false;
        practiceAnchorEl.textContent = `Starts with: ${model.collocation.display_phrase} …`;
      } else {
        practiceAnchorEl.hidden = true;
        practiceAnchorEl.textContent = "";
      }
    }
    renderExerciseStem(stemHost, model);

    const placeholder = getPracticeUiSettings(catalog).fillBlankPlaceholder;

    if (model.kind === "mc" || model.kind === "verb_behavior") {
      currentInteractionKind =
        model.kind === "verb_behavior" ? "verb_behavior" : "mc";
      renderMultipleChoice(
        actionsHost,
        model.choices,
        (value) => {
          onAnswer(value, false);
        },
        { markPicked: model.kind === "mc" }
      );
    } else if (model.kind === "fill") {
      currentInteractionKind = "fill";
      renderFillBlank(actionsHost, (value) => onAnswer(value, false), {
        placeholder,
      });
    }

    updateSessionStatsEl();
    updatePracticeScoreLine();

    root.classList.toggle("practice-view--mc-focus", model.kind === "mc");
  }

  nextBtn.addEventListener("click", () => {
    removeEnterAdvance();
    const nextRecent = [currentId, ...pickerState.recentIds].filter(Boolean);
    pickerState.recentIds = nextRecent.slice(0, bufferSize);
    const next = pickNextExerciseId(
      catalog,
      mode,
      currentId,
      pickerState,
      filterOpts
    );
    bindExercise(next);
  });

  bindExercise(currentId);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

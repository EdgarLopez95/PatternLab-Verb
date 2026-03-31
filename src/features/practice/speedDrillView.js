import { navigate } from "../../app/router.js";
import {
  buildSpeedItemPool,
  pickNextSpeedItem,
  validateSpeedTap,
} from "../../domain/speedTap.js";

/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
function getSpeedSettings(catalog) {
  const s = catalog.settings?.speed ?? {};
  const sel = catalog.settings?.selection ?? {};
  return {
    secondsPerQuestion: typeof s.secondsPerQuestion === "number" ? s.secondsPerQuestion : 10,
    postAnswerDelayMsCorrect:
      typeof s.postAnswerDelayMsCorrect === "number" ? s.postAnswerDelayMsCorrect : 550,
    postAnswerDelayMsWrong:
      typeof s.postAnswerDelayMsWrong === "number" ? s.postAnswerDelayMsWrong : 900,
    postAnswerDelayMsTimeout:
      typeof s.postAnswerDelayMsTimeout === "number"
        ? s.postAnswerDelayMsTimeout
        : Math.max(
            typeof s.postAnswerDelayMsWrong === "number" ? s.postAnswerDelayMsWrong : 900,
            1000
          ),
    recentBufferSize:
      typeof s.recentBufferSize === "number"
        ? s.recentBufferSize
        : typeof sel.recentBufferSize === "number"
          ? sel.recentBufferSize
          : 4,
  };
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 * @param {string|null} [patternIdFilter]
 */
export function mountSpeedDrill(root, catalog, patternIdFilter = null) {
  const filterOpts = patternIdFilter ? { patternId: patternIdFilter } : {};
  let pool = buildSpeedItemPool(catalog, filterOpts);
  if (!pool.length) {
    pool = buildSpeedItemPool(catalog, {});
  }

  const sp = getSpeedSettings(catalog);

  const patternBanner =
    patternIdFilter && catalog.patternsById[patternIdFilter]
      ? `<p class="pattern-filter-banner muted" role="status">Practicing: <strong>${escapeHtml(
          catalog.patternsById[patternIdFilter].name
        )}</strong></p>`
      : "";

  root.innerHTML = `
    <div class="view-head view-head--split view-head--speed" data-mode="speed">
      <button type="button" class="btn btn--ghost back-btn">Home</button>
      <div class="view-head__center">
        <h1 class="view-title">Speed drill</h1>
        ${patternBanner}
        <div class="speed-hud" role="status" aria-live="polite">
          <div class="speed-hud__timer-row">
            <div class="speed-timer-slot" data-timer-slot>
              <span class="speed-timer-slot__value" data-timer>—</span>
              <span class="speed-timer-slot__suffix">s left</span>
            </div>
          </div>
          <div class="speed-hud__scores">
            <span class="speed-hud__correct">Correct: <strong data-correct-count>0</strong></span>
            <span class="speed-hud__wrong">Wrong: <strong data-wrong-count>0</strong></span>
          </div>
        </div>
      </div>
    </div>
    <main class="speed-main">
      ${
        pool.length === 0
          ? `<p class="error">No verbs available for speed drill.</p>`
          : `<section class="card speed-card" data-phase="answering" aria-live="assertive">
        <p class="speed-prompt muted" id="speed-prompt">Choose -ing or to + verb.</p>
        <div class="speed-verb-block">
          <p class="speed-item-kind" data-speed-kind></p>
          <p class="speed-verb" data-speed-verb></p>
          <p class="speed-context muted" data-speed-context hidden></p>
        </div>
        <p class="speed-flash" data-speed-flash hidden></p>
        <div class="speed-tap-row">
          <button type="button" class="btn speed-tap-btn" data-tap="gerund" disabled>-ing</button>
          <button type="button" class="btn speed-tap-btn" data-tap="infinitive" disabled>to + verb</button>
        </div>
        <button type="button" class="btn btn--primary speed-continue-btn" hidden>Continue</button>
      </section>`
      }
    </main>
  `;

  const back = root.querySelector(".back-btn");
  back?.addEventListener("click", () => navigate("#/home"));

  if (!pool.length) return;

  const card = root.querySelector(".speed-card");
  const verbEl = root.querySelector("[data-speed-verb]");
  const kindEl = root.querySelector("[data-speed-kind]");
  const contextEl = root.querySelector("[data-speed-context]");
  const timerSlotEl = root.querySelector("[data-timer-slot]");
  const flashEl = root.querySelector("[data-speed-flash]");
  const tapGerund = root.querySelector('[data-tap="gerund"]');
  const tapInf = root.querySelector('[data-tap="infinitive"]');
  const continueBtn = root.querySelector(".speed-continue-btn");
  const correctEl = root.querySelector("[data-correct-count]");
  const wrongEl = root.querySelector("[data-wrong-count]");
  const timerEl = root.querySelector("[data-timer]");

  if (
    !card ||
    !verbEl ||
    !kindEl ||
    !contextEl ||
    !timerSlotEl ||
    !flashEl ||
    !tapGerund ||
    !tapInf ||
    !continueBtn ||
    !correctEl ||
    !wrongEl ||
    !timerEl
  ) {
    return;
  }

  const recentIds = [];
  let currentItem = null;
  let correctCount = 0;
  let wrongCount = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let timerInterval = null;
  let deadlineMs = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let advanceTimeout = null;

  function updateHud() {
    correctEl.textContent = String(correctCount);
    wrongEl.textContent = String(wrongCount);
  }

  function clearQuestionTimer() {
    if (timerInterval != null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function clearAdvanceTimer() {
    if (advanceTimeout != null) {
      clearTimeout(advanceTimeout);
      advanceTimeout = null;
    }
  }

  function startQuestionTimer(onTimeout) {
    clearQuestionTimer();
    deadlineMs = Date.now() + sp.secondsPerQuestion * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
      timerEl.textContent = String(left);
      timerSlotEl.classList.toggle("speed-timer-slot--low", left > 0 && left <= 3);
      if (left <= 0) {
        timerSlotEl.classList.remove("speed-timer-slot--low");
        clearQuestionTimer();
        onTimeout();
      }
    };
    tick();
    timerInterval = setInterval(tick, 200);
  }

  function setTapsEnabled(on) {
    tapGerund.disabled = !on;
    tapInf.disabled = !on;
  }

  /**
   * @param {boolean} correct
   * @param {boolean} timedOut
   */
  function scheduleAdvance(correct, timedOut) {
    clearAdvanceTimer();
    let delay;
    if (correct) {
      delay = sp.postAnswerDelayMsCorrect;
    } else if (timedOut) {
      delay = sp.postAnswerDelayMsTimeout;
    } else {
      delay = sp.postAnswerDelayMsWrong;
    }
    if (delay > 0) {
      advanceTimeout = setTimeout(() => goNextRound(), delay);
    } else {
      continueBtn.hidden = false;
    }
  }

  function goNextRound() {
    clearAdvanceTimer();
    continueBtn.hidden = true;
    flashEl.hidden = true;
    card.classList.remove("speed-card--ok", "speed-card--bad");

    const nextRecent = [currentItem?.itemId, ...recentIds].filter(Boolean);
    const trimmed = nextRecent.slice(0, sp.recentBufferSize);
    recentIds.length = 0;
    recentIds.push(...trimmed);

    const next = pickNextSpeedItem(
      pool,
      currentItem?.itemId ?? null,
      recentIds,
      sp.recentBufferSize
    );
    if (!next) return;
    currentItem = next;

    verbEl.textContent = next.baseForm;
    const isTricky = next.kind === "tricky";
    kindEl.textContent = isTricky ? "Tricky verb (two forms)" : "One form only";
    kindEl.classList.toggle("speed-item-kind--tricky", isTricky);
    kindEl.classList.toggle("speed-item-kind--single", !isTricky);
    if (isTricky && next.contextLabel) {
      contextEl.hidden = false;
      contextEl.textContent = next.contextLabel;
    } else {
      contextEl.hidden = true;
      contextEl.textContent = "";
    }

    setTapsEnabled(true);
    card.setAttribute("data-phase", "answering");
    startQuestionTimer(() => handleResult(false, true));
  }

  /**
   * @param {boolean} correct
   * @param {boolean} timedOut
   */
  function handleResult(correct, timedOut) {
    clearQuestionTimer();
    setTapsEnabled(false);

    if (correct) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
    updateHud();

    const correctLabel =
      currentItem?.expected === "gerund" ? "-ing" : "to + verb";

    card.setAttribute("data-phase", "reviewed");
    if (correct) {
      card.classList.add("speed-card--ok");
      flashEl.textContent = timedOut ? "" : "OK";
    } else {
      card.classList.add("speed-card--bad");
      flashEl.textContent = timedOut
        ? `Time's up. Right: ${correctLabel}`
        : "Not quite";
    }
    flashEl.hidden = false;

    scheduleAdvance(correct, timedOut);
  }

  function onTap(expectedFromUser) {
    if (!currentItem || card.getAttribute("data-phase") !== "answering") return;
    const { correct } = validateSpeedTap(currentItem, expectedFromUser);
    handleResult(correct, false);
  }

  tapGerund.addEventListener("click", () => onTap("gerund"));
  tapInf.addEventListener("click", () => onTap("infinitive"));

  continueBtn.addEventListener("click", () => {
    goNextRound();
  });

  goNextRound();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

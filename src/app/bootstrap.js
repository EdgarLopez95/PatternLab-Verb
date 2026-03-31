import { loadAllData } from "../services/dataLoader.js";
import { buildCatalog } from "../domain/buildCatalog.js";
import { createSessionState } from "./sessionState.js";
import { parseRoute, startRouter } from "./router.js";
import { renderHome } from "../features/home/homeView.js";
import { mountLearn } from "../features/learn/learnView.js";
import { mountPractice } from "../features/practice/practiceView.js";

const PRACTICE_MODES = ["practice", "tricky", "mixed", "speed"];

export async function bootstrap() {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app container");

  const raw = await loadAllData();
  const catalog = buildCatalog(raw);
  const session = createSessionState();
  session.catalog = catalog;

  const render = () => {
    const route = parseRoute();
    app.innerHTML = "";
    if (route.name === "home") {
      renderHome(app, catalog);
    } else if (route.name === "learn") {
      mountLearn(app, catalog, route.patternId);
    } else if (route.name === "practice") {
      const mode = PRACTICE_MODES.includes(route.mode) ? route.mode : "practice";
      const patternId =
        route.patternId && catalog.patternsById[route.patternId]
          ? route.patternId
          : null;
      mountPractice(app, catalog, mode, patternId);
    } else {
      renderHome(app, catalog);
    }
  };

  startRouter(render);
}

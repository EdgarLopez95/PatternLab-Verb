import { bootstrap } from "./src/app/bootstrap.js";

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

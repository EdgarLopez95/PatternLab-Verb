export function parseRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "") || "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const parts = path.split("/").filter(Boolean);

  if (parts.length === 0) return { name: "home" };

  const [a, b] = parts;
  if (a === "home") return { name: "home" };
  if (a === "learn") {
    return b ? { name: "learn", patternId: b } : { name: "learn" };
  }
  if (a === "practice") {
    const mode = b || "practice";
    const patternId = parts[2] || null;
    return { name: "practice", mode, patternId };
  }
  return { name: "home" };
}

/** @param {string} hash e.g. '#/practice/tricky' */
export function navigate(hash) {
  if (hash.startsWith("#")) {
    location.hash = hash;
  } else {
    location.hash = `#${hash.startsWith("/") ? hash : `/${hash}`}`;
  }
}

/** @param {(route: ReturnType<typeof parseRoute>) => void} onChange */
export function startRouter(onChange) {
  const run = () => onChange(parseRoute());
  window.addEventListener("hashchange", run);
  run();
  return () => window.removeEventListener("hashchange", run);
}

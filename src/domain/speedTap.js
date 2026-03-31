/**
 * Speed drill: verb + binary tap (gerund vs infinitive).
 * Pool = simple verbs from verbs.json + contextual rows from speed_contexts.json.
 */

/**
 * @typedef {'gerund'|'infinitive'} SpeedExpected
 */

/**
 * @typedef {'single'|'tricky'} SpeedItemKind
 */

/**
 * @typedef {object} SpeedItem
 * @property {string} itemId
 * @property {string} verbId
 * @property {string} baseForm
 * @property {SpeedExpected} expected
 * @property {SpeedItemKind} kind
 * @property {string} [contextLabel]
 */

/**
 * @param {ReturnType<import('./buildCatalog.js').buildCatalog>} catalog
 * @param {{ patternId?: string | null }} [filterOpts]
 * @returns {SpeedItem[]}
 */
export function buildSpeedItemPool(catalog, filterOpts = {}) {
  const pid = filterOpts.patternId || null;
  const contexts = catalog.speedContexts || [];

  /** @param {{ pattern_usages?: string[] }} v */
  function verbMatchesFilter(v) {
    if (!pid) return true;
    return v.pattern_usages?.includes(pid) ?? false;
  }

  /** @type {SpeedItem[]} */
  const items = [];

  for (const v of catalog.verbs) {
    if (!verbMatchesFilter(v)) continue;

    if (v.pattern_behavior === "only_gerund") {
      items.push({
        itemId: `simple:${v.id}:gerund`,
        verbId: v.id,
        baseForm: v.base_form,
        expected: "gerund",
        kind: "single",
      });
    } else if (v.pattern_behavior === "only_infinitive") {
      items.push({
        itemId: `simple:${v.id}:infinitive`,
        verbId: v.id,
        baseForm: v.base_form,
        expected: "infinitive",
        kind: "single",
      });
    } else if (v.pattern_behavior === "both_change") {
      for (const row of contexts) {
        if (row.verb_id !== v.id) continue;
        const exp = row.expected;
        if (exp !== "gerund" && exp !== "infinitive") continue;
        items.push({
          itemId: `ctx:${row.id}`,
          verbId: v.id,
          baseForm: v.base_form,
          contextLabel: row.context_label,
          expected: exp,
          kind: "tricky",
        });
      }
    }
  }

  return items;
}

/**
 * @param {SpeedItem[]} items
 * @param {string|null} excludeItemId
 * @param {string[]} recentIds
 * @param {number} bufferSize
 * @returns {SpeedItem|null}
 */
export function pickNextSpeedItem(items, excludeItemId, recentIds, bufferSize) {
  if (!items.length) return null;
  const avoid = new Set([excludeItemId, ...recentIds].filter(Boolean));
  let usable = items.filter((it) => !avoid.has(it.itemId));
  if (!usable.length) {
    usable = items.filter((it) => it.itemId !== excludeItemId);
  }
  if (!usable.length) usable = items.slice();
  const i = Math.floor(Math.random() * usable.length);
  return usable[i];
}

/**
 * @param {SpeedItem} item
 * @param {SpeedExpected} userTap
 */
export function validateSpeedTap(item, userTap) {
  return { correct: userTap === item.expected };
}

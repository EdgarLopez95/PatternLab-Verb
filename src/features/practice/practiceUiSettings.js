/**
 * @param {ReturnType<import('../../domain/buildCatalog.js').buildCatalog>} catalog
 */
export function getPracticeUiSettings(catalog) {
  const ui = catalog.settings?.ui ?? {};
  return {
    fillBlankPlaceholder:
      typeof ui.fillBlankPlaceholder === "string"
        ? ui.fillBlankPlaceholder
        : "e.g. -ing or to + verb",
    enterToAdvanceOnCorrect: ui.enterToAdvanceOnCorrect === true,
    showSessionStats: ui.showSessionStats === true,
  };
}

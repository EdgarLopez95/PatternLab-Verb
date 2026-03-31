/**
 * Convert text with simple **bold** to safe HTML.
 * @param {string} text
 */
export function feedbackBodyToHtml(text) {
  if (!text) return "";
  const esc = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

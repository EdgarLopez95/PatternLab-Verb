/**
 * @param {{ sentence_parts: { prefix: string; target: string; suffix: string } }} example
 * @param {{ hideTarget?: boolean }} opts
 */
export function formatSentenceParts(example, opts = {}) {
  const { prefix, target, suffix } = example.sentence_parts;
  if (opts.hideTarget) {
    return { prefix, suffix, placeholder: "…" };
  }
  return { prefix, target, suffix, full: `${prefix}${target}${suffix}` };
}

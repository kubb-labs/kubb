import { stringify } from 'yaml'

/**
 * Markdown `print` input — either a markdown text fragment (passed through
 * verbatim) or a plain object that is serialised as a YAML frontmatter envelope.
 */
export type PrintInput = string | Record<string, unknown>

/**
 * Wraps a plain object as a YAML frontmatter envelope:
 *
 * ```
 * ---
 * <yaml>
 * ---
 * ```
 *
 * Returns an empty string for `null`, `undefined`, or empty objects so callers
 * can drop the result through the same filter chain as banner/footer fields.
 */
export function printFrontmatter(data: Record<string, unknown> | null | undefined): string {
  if (!data || Object.keys(data).length === 0) return ''
  return `---\n${stringify(data).trimEnd()}\n---`
}

/**
 * Joins a list of markdown fragments with blank lines. Plain objects are
 * rendered as YAML frontmatter via {@link printFrontmatter}; strings pass
 * through unchanged.
 *
 * @example
 * ```ts
 * print({ title: 'Hi' }, '# Hello')
 * // '---\ntitle: Hi\n---\n\n# Hello'
 * ```
 */
export function print(...parts: Array<PrintInput | null | undefined>): string {
  const rendered: string[] = []
  for (const part of parts) {
    if (part === null || part === undefined || part === '') continue
    const text = typeof part === 'string' ? part : printFrontmatter(part)
    if (text) rendered.push(text.trimEnd())
  }
  return rendered.join('\n\n')
}

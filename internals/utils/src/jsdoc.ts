/**
 * Builds a JSDoc comment block from an array of lines.
 * Returns `fallback` when `comments` is empty so callers always get a usable string.
 */
export function buildJSDoc(
  comments: Array<string>,
  options: {
    /** String to use for indenting each line. Defaults to `'   * '`. */
    indent?: string
    /** String appended after the closing tag. Defaults to `'\n  '`. */
    suffix?: string
    /** Returned as-is when `comments` is empty. Defaults to `'  '`. */
    fallback?: string
  } = {},
): string {
  const { indent = '   * ', suffix = '\n  ', fallback = '  ' } = options

  if (comments.length === 0) return fallback

  return `/**\n${comments.map((c) => `${indent}${c}`).join('\n')}\n   */${suffix}`
}

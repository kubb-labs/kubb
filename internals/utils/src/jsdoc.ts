/**
 * Builds a JSDoc comment block with configurable indentation.
 *
 * @param comments - Lines to include in the JSDoc block.
 * @returns A formatted JSDoc string, or `fallback` when there are no comments.
 */
export function buildJSDoc(
  comments: Array<string>,
  options: {
    /** String to use for indenting each line. @default '   * ' */
    indent?: string
    /** String appended after the closing tag. @default '\n  ' */
    suffix?: string
    /** Returned when `comments` is empty. @default '  ' */
    fallback?: string
  } = {},
): string {
  const { indent = '   * ', suffix = '\n  ', fallback = '  ' } = options

  if (comments.length === 0) return fallback

  return `/**\n${comments.map((c) => `${indent}${c}`).join('\n')}\n   */${suffix}`
}

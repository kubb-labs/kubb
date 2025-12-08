/**
 * Builds a JSDoc comment block with custom indentation.
 * @param comments - Array of comment strings to include in the JSDoc block
 * @param options - Configuration options for formatting
 * @returns Formatted JSDoc string or fallback string if no comments
 */
export function buildJSDoc(
  comments: Array<string>,
  options: {
    /**
     * String to use for indenting each line of the JSDoc comment
     * @default '   * ' (3 spaces + asterisk + space)
     */
    indent?: string
    /**
     * String to append after the closing JSDoc tag
     * @default '\n  ' (newline + 2 spaces)
     */
    suffix?: string
    /**
     * String to return when there are no comments
     * @default '  ' (2 spaces)
     */
    fallback?: string
  } = {},
): string {
  const { indent = '   * ', suffix = '\n  ', fallback = '  ' } = options

  if (comments.length === 0) {
    return fallback
  }

  return `/**\n${comments.map((c) => `${indent}${c}`).join('\n')}\n   */${suffix}`
}

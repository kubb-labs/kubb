/**
 * Strips a single matching pair of `"..."`, `'...'`, or `` `...` `` from both ends of `text`.
 * Returns the string unchanged when no balanced quote pair is found.
 *
 * @example
 * trimQuotes('"hello"') // 'hello'
 * trimQuotes('hello')   // 'hello'
 */
export function trimQuotes(text: string): string {
  if (text.length >= 2) {
    const first = text[0]
    const last = text[text.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === '`' && last === '`')) {
      return text.slice(1, -1)
    }
  }
  return text
}

/**
 * Escapes characters that are not allowed inside JS string literals.
 * Handles quotes, backslashes, and Unicode line terminators (U+2028 / U+2029).
 *
 * @see http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 *
 * @example
 * ```ts
 * jsStringEscape('say "hi"\nbye') // 'say \\"hi\\"\\nbye'
 * ```
 */
export function jsStringEscape(input: unknown): string {
  return `${input}`.replace(/["'\\\n\r\u2028\u2029]/g, (character) => {
    switch (character) {
      case '"':
      case "'":
      case '\\':
        return `\\${character}`
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
      default:
        return ''
    }
  })
}

/**
 * Returns a masked version of a string, showing only the first and last few characters.
 * Useful for logging sensitive values (tokens, keys) without exposing the full value.
 *
 * @example
 * maskString('KUBB_STUDIO-abc123-xyz789') // 'KUBB_STUDIO-…789'
 */
export function maskString(value: string, start = 8, end = 4): string {
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}…${value.slice(-end)}`
}

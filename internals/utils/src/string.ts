// ─── Trim ─────────────────────────────────────────────────────────────────────

/**
 * Strips a single matching pair of `"..."`, `'...'`, or `` `...` `` from both ends.
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

// ─── Escape ───────────────────────────────────────────────────────────────────

/** Escapes backtick characters for safe use inside template literals. */
export function escape(text?: string): string {
  return text ? text.replaceAll('`', '\\`') : ''
}

/**
 * Escapes characters not allowed in JS string literals.
 * @link http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
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

// ─── Mask ─────────────────────────────────────────────────────────────────────

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

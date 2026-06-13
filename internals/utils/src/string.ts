/**
 * Wraps a value in single quotes for emitting a single-quoted JavaScript string literal, escaping
 * any backslash or single quote in the content.
 *
 * @example
 * ```ts
 * singleQuote('foo')      // "'foo'"
 * singleQuote("o'clock")  // "'o\\'clock'"
 * ```
 */
export function singleQuote(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "''"
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  return `'${escaped}'`
}

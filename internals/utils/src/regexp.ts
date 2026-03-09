import { trimQuotes } from './string.ts'

/**
 * Converts a pattern string into a `new RegExp(...)` constructor call or a regex literal string.
 * Inline flags expressed as `^(?im)` prefixes are extracted and applied to the resulting expression.
 * Pass `null` as the second argument to emit a `/pattern/flags` literal instead.
 *
 * @example
 * toRegExpString('^(?im)foo')       // → 'new RegExp("foo", "im")'
 * toRegExpString('^(?im)foo', null) // → '/foo/im'
 */
export function toRegExpString(text: string, func: string | null = 'RegExp'): string {
  const raw = trimQuotes(text)

  const match = raw.match(/^\^(\(\?([igmsuy]+)\))/i)
  const replacementTarget = match?.[1] ?? ''
  const matchedFlags = match?.[2]
  const cleaned = raw
    .replace(/^\\?\//, '')
    .replace(/\\?\/$/, '')
    .replace(replacementTarget, '')

  const { source, flags } = new RegExp(cleaned, matchedFlags)

  if (func === null) return `/${source}/${flags}`

  return `new ${func}(${JSON.stringify(source)}${flags ? `, ${JSON.stringify(flags)}` : ''})`
}

import { trimQuotes } from './string.ts'

/**
 * Converts a string to a RegExp constructor expression or a RegExp literal string.
 *
 * @param text - The regex pattern, optionally wrapped in quotes or slashes.
 * @param func - Constructor name (`"RegExp"` by default). Pass `null` to return a literal (`/pattern/flags`).
 *
 * @example
 * toRegExpString('^(?im)foo')          // → 'new RegExp("foo", "im")'
 * toRegExpString('^(?im)foo', null)    // → '/foo/im'
 */
export function toRegExpString(text: string, func: string | null = 'RegExp'): string {
  const raw = trimQuotes(text)

  const [, replacementTarget = '', matchedFlags] = raw.match(/^\^(\(\?([igmsuy]+)\))/i) ?? []
  const cleaned = raw
    .replace(/^\\?\//, '')
    .replace(/\\?\/$/, '')
    .replace(replacementTarget, '')

  const regex = new RegExp(cleaned, matchedFlags)
  const source = regex.source
  const flags = regex.flags

  if (func === null) return `/${source}/${flags}`

  return `new ${func}(${JSON.stringify(source)}${flags ? `, ${JSON.stringify(flags)}` : ''})`
}

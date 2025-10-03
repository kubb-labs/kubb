import { trimQuotes } from './trim'

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

  if (func === null) {
    return `/${source}/${flags}`
  }

  // return as constructor → new RegExp("pattern", "flags")
  return `new ${func}(${JSON.stringify(source)}${flags ? `, ${JSON.stringify(flags)}` : ''})`
}

import { jsStringEscape } from './escape'
import { trimQuotes } from './trim'

function stringToRegex(text: string) {
  const isStartWithSlash = text.startsWith('/')
  const isEndWithSlash = text.endsWith('/')

  return new RegExp(text.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined))
}

/**
 * @experimental
 */
export function toRegExp(text: string | RegExp): RegExp {
  if (typeof text === 'string') {
    const source = trimQuotes(text)

    return stringToRegex(source)
  }

  return stringToRegex(text.toString())
}

export function toRegExpString(text: string, func: string | null = 'RegExp'): string {
  const isStartWithSlash = text.startsWith('/')
  const isEndWithSlash = text.endsWith('/')

  if (func === null) {
    return `/${text.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined).replaceAll('/', '\\/')}/`
  }

  const regexp = `new ${func}('${jsStringEscape(text.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined))}')`

  return regexp
}

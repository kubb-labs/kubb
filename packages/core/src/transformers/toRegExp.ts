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

export function toRegExpString(text: string): string {
  const isStartWithSlash = text.startsWith('/')
  const isEndWithSlash = text.endsWith('/')

  const regexp = `new RegExp('${
    jsStringEscape(
      text.slice(isStartWithSlash ? 1 : 0, isEndWithSlash ? -1 : undefined),
    )
  }')`

  return regexp
}

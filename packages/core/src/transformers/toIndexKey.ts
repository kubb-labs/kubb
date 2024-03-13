import { isNumber, toNumber } from './toNumber'
import { toString } from './toString'
import { trimQuotes } from './trim'

export function toIndexKey(text: string | number): string | number {
  if (isNumber(text)) {
    return toNumber(text)
  }

  if (typeof text === 'string') {
    return JSON.stringify(trimQuotes(text))
  }

  return toString(text || '')
}

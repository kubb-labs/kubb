import { stringify } from './stringify'
import { isNumber, toNumber } from './toNumber'

export function toIndexKey(text: string | number): string | number {
  if (isNumber(text)) {
    return toNumber(text)
  }

  if (typeof text === 'string') {
    return stringify(text)
  }

  return stringify(text || '')
}

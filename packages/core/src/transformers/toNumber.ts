import _toNumber from 'lodash.tonumber'

export function isNumber(value: unknown): value is number {
  if (typeof value === 'string') {
    if (value === '') {
      return false
    }

    return !isNaN(toNumber(value))
  }
  return typeof value === 'number'
}
export const toNumber = _toNumber

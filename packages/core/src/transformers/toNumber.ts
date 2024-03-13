import _toNumber from 'lodash.tonumber'

export function isNumber(value: unknown): value is number {
  if (typeof value === 'string') {
    return !isNaN(toNumber(value))
  }
  return typeof value === 'number'
}
export const toNumber = _toNumber

import type { MaybePromise } from '../types'

export function isPromise<T>(result: MaybePromise<T>): result is Promise<T> {
  return typeof (result as any)?.then === 'function'
}

import type { MaybePromise } from '../types.js'

export function isPromise<T>(result: MaybePromise<T>): result is Promise<T> {
  return typeof (result as Promise<unknown>)?.then === 'function'
}

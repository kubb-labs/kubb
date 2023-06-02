import type { MaybePromise } from '../types.ts'

export function isPromise<T>(result: MaybePromise<T>): result is Promise<T> {
  return typeof (result as Promise<unknown>)?.then === 'function'
}

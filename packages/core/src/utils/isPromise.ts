import type { MaybePromise } from '../types.ts'

export function isPromise<T>(result: MaybePromise<T>): result is Promise<T> {
  return typeof (result as Promise<unknown>)?.then === 'function'
}

export function isPromiseFulfilledResult<T = unknown>(result: PromiseSettledResult<unknown>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled'
}

export function isPromiseRejectedResult<T>(result: PromiseSettledResult<unknown>): result is Omit<PromiseRejectedResult, 'reason'> & { reason: T } {
  return result.status === 'rejected'
}

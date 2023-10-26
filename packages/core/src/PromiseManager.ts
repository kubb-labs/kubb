import { hookSeq } from './utils/executeStrategies.ts'

type PossiblePromise<T> = Promise<T> | T

type PromiseFunc<T, T2 = never> = () => T2 extends never ? Promise<T> : Promise<T> | T2

type SeqOutput<TInput extends Array<PromiseFunc<TPromise, null>>, TPromise = unknown> = ReturnType<NonNullable<TInput[number]>>

// eslint-disable-next-line @typescript-eslint/ban-types
type Options = {}

type Strategy = 'seq'

export class PromiseManager {
  #options: Options = {}

  constructor(options: Options = {}) {
    this.#options = options

    return this
  }

  run<TInput extends Array<PromiseFunc<TPromise, null>>, TPromise = unknown, TOutput = SeqOutput<TInput, TPromise>>(
    strategy: Strategy,
    promises: TInput,
  ): TOutput {
    if (strategy === 'seq') {
      return hookSeq<TInput, TPromise, TOutput>(promises)
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`${strategy} not implemented`)
  }
}

export function isPromise<T>(result: PossiblePromise<T>): result is Promise<T> {
  return !!result && typeof (result as Promise<unknown>)?.then === 'function'
}

export function isPromiseFulfilledResult<T = unknown>(result: PromiseSettledResult<unknown>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled'
}

export function isPromiseRejectedResult<T>(result: PromiseSettledResult<unknown>): result is Omit<PromiseRejectedResult, 'reason'> & { reason: T } {
  return result.status === 'rejected'
}

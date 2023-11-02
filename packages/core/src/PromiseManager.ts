import { hookFirst, hookSeq } from './utils/executeStrategies.ts'

import type { Strategy, StrategySwitch } from './utils/executeStrategies.ts'

type PossiblePromise<T> = Promise<T> | T

type PromiseFunc<T = unknown, T2 = never> = () => T2 extends never ? Promise<T> : Promise<T> | T2

type Options<TState = any> = {
  nullCheck?: (state: TState) => boolean
}

export class PromiseManager<TState = any> {
  #options: Options<TState> = {}

  constructor(options: Options<TState> = {}) {
    this.#options = options

    return this
  }

  run<TInput extends Array<PromiseFunc<TValue, null>>, TValue, TStrategy extends Strategy, TOutput = StrategySwitch<TStrategy, TInput, TValue>>(
    strategy: TStrategy,
    promises: TInput,
  ): TOutput {
    if (strategy === 'seq') {
      return hookSeq<TInput, TValue, TOutput>(promises)
    }

    if (strategy === 'first') {
      return hookFirst<TInput, TValue, TOutput>(promises, this.#options.nullCheck)
    }

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

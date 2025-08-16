import type { Strategy, StrategySwitch } from './utils/executeStrategies.ts'
import { hookFirst, hookParallel, hookSeq } from './utils/executeStrategies.ts'

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
    { concurrency = Number.POSITIVE_INFINITY }: { concurrency?: number } = {},
  ): TOutput {
    if (strategy === 'seq') {
      return hookSeq<TInput, TValue, TOutput>(promises)
    }

    if (strategy === 'first') {
      return hookFirst<TInput, TValue, TOutput>(promises, this.#options.nullCheck)
    }

    if (strategy === 'parallel') {
      return hookParallel<TInput, TValue, TOutput>(promises, concurrency)
    }

    throw new Error(`${strategy} not implemented`)
  }
}

export function isPromiseRejectedResult<T>(result: PromiseSettledResult<unknown>): result is Omit<PromiseRejectedResult, 'reason'> & { reason: T } {
  return result.status === 'rejected'
}

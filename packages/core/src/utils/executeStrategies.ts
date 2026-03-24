import pLimit from 'p-limit'

type PromiseFunc<T = unknown, T2 = never> = (state?: T) => T2 extends never ? Promise<T> : Promise<T> | T2

type ValueOfPromiseFuncArray<TInput extends Array<unknown>> = TInput extends Array<PromiseFunc<infer X, infer Y>> ? X | Y : never

type SeqOutput<TInput extends Array<PromiseFunc<TValue, null>>, TValue> = Promise<Array<Awaited<ValueOfPromiseFuncArray<TInput>>>>

/**
 * Runs promise functions in sequence, threading each result into the next call.
 *
 * - Each function receives the accumulated state from the previous call.
 * - Skips functions that return a falsy value (acts as a no-op for that step).
 * - Returns an array of all individual results.
 */
export function hookSeq<TInput extends Array<PromiseFunc<TValue, null>>, TValue, TOutput = SeqOutput<TInput, TValue>>(promises: TInput): TOutput {
  return promises.filter(Boolean).reduce(
    (promise, func) => {
      if (typeof func !== 'function') {
        throw new Error('HookSeq needs a function that returns a promise `() => Promise<unknown>`')
      }

      return promise.then((state) => {
        const calledFunc = func(state as TValue)

        if (calledFunc) {
          return calledFunc.then(Array.prototype.concat.bind(state) as (result: TValue) => TValue[])
        }

        return state
      })
    },
    Promise.resolve([] as Array<TValue>),
  ) as TOutput
}

type HookFirstOutput<TInput extends Array<PromiseFunc<TValue, null>>, TValue = unknown> = ValueOfPromiseFuncArray<TInput>

/**
 * Runs promise functions in sequence and returns the first non-null result.
 *
 * - Stops as soon as `nullCheck` passes for a result (default: `!== null`).
 * - Subsequent functions are skipped once a match is found.
 */
export function hookFirst<TInput extends Array<PromiseFunc<TValue, null>>, TValue = unknown, TOutput = HookFirstOutput<TInput, TValue>>(
  promises: TInput,
  nullCheck: (state: unknown) => boolean = (state) => state !== null,
): TOutput {
  let promise: Promise<unknown> = Promise.resolve(null) as Promise<unknown>

  for (const func of promises.filter(Boolean)) {
    promise = promise.then((state) => {
      if (nullCheck(state)) {
        return state
      }

      return func(state as TValue)
    })
  }

  return promise as TOutput
}

type HookParallelOutput<TInput extends Array<PromiseFunc<TValue, null>>, TValue> = Promise<PromiseSettledResult<Awaited<ValueOfPromiseFuncArray<TInput>>>[]>

/**
 * Runs promise functions concurrently and returns all settled results.
 *
 * - Limits simultaneous executions to `concurrency` (default: unlimited).
 * - Uses `Promise.allSettled` so individual failures do not cancel other tasks.
 */
export function hookParallel<TInput extends Array<PromiseFunc<TValue, null>>, TValue = unknown, TOutput = HookParallelOutput<TInput, TValue>>(
  promises: TInput,
  concurrency: number = Number.POSITIVE_INFINITY,
): TOutput {
  const limit = pLimit(concurrency)

  const tasks = promises.filter(Boolean).map((promise) => limit(() => promise()))

  return Promise.allSettled(tasks) as TOutput
}

/**
 * Execution strategy used when dispatching plugin hook calls.
 */
export type Strategy = 'seq' | 'first' | 'parallel'

type StrategyOutputMap<TInput extends Array<PromiseFunc<TValue, null>>, TValue> = {
  first: HookFirstOutput<TInput, TValue>
  seq: SeqOutput<TInput, TValue>
  parallel: HookParallelOutput<TInput, TValue>
}

export type StrategySwitch<TStrategy extends Strategy, TInput extends Array<PromiseFunc<TValue, null>>, TValue> = StrategyOutputMap<TInput, TValue>[TStrategy]

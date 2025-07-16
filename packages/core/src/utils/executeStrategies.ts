import pLimit from 'p-limit'

type PromiseFunc<T = unknown, T2 = never> = (state?: T) => T2 extends never ? Promise<T> : Promise<T> | T2

type ValueOfPromiseFuncArray<TInput extends Array<unknown>> = TInput extends Array<PromiseFunc<infer X, infer Y>> ? X | Y : never

type SeqOutput<TInput extends Array<PromiseFunc<TValue, null>>, TValue> = Promise<Array<Awaited<ValueOfPromiseFuncArray<TInput>>>>

/**
 * Chains promises
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
          return calledFunc.then(Array.prototype.concat.bind(state))
        }
      })
    },
    Promise.resolve([] as unknown),
  ) as TOutput
}

type HookFirstOutput<TInput extends Array<PromiseFunc<TValue, null>>, TValue = unknown> = ValueOfPromiseFuncArray<TInput>

/**
 * Chains promises, first non-null result stops and returns
 */
export function hookFirst<TInput extends Array<PromiseFunc<TValue, null>>, TValue = unknown, TOutput = HookFirstOutput<TInput, TValue>>(
  promises: TInput,
  nullCheck = (state: any) => state !== null,
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
 * Runs an array of promise functions with optional concurrency limit.
 */
export function hookParallel<TInput extends Array<PromiseFunc<TValue, null>>, TValue = unknown, TOutput = HookParallelOutput<TInput, TValue>>(
  promises: TInput,
  concurrency: number = Number.POSITIVE_INFINITY,
): TOutput {
  const limit = pLimit(concurrency)

  const tasks = promises.filter(Boolean).map((promise) => limit(() => promise()))

  return Promise.allSettled(tasks) as TOutput
}

export type Strategy = 'seq' | 'first' | 'parallel'

export type StrategySwitch<TStrategy extends Strategy, TInput extends Array<PromiseFunc<TValue, null>>, TValue> = TStrategy extends 'first'
  ? HookFirstOutput<TInput, TValue>
  : TStrategy extends 'seq'
    ? SeqOutput<TInput, TValue>
    : TStrategy extends 'parallel'
      ? HookParallelOutput<TInput, TValue>
      : never

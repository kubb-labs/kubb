type PromiseFunc<T, T2 = never> = () => T2 extends never ? Promise<T> : Promise<T> | T2

export function noReturn(): void {}

type SeqOutput<TInput extends Array<PromiseFunc<TPromise, null>>, TPromise = unknown> = ReturnType<NonNullable<TInput[number]>>

export function hookSeq<TInput extends Array<PromiseFunc<TPromise, null>>, TPromise = unknown, TOutput = SeqOutput<TInput, TPromise>>(
  promises: TInput,
): TOutput {
  return promises.reduce(
    (promise, func) => {
      if (!func || typeof func !== 'function') {
        throw new Error('HookSeq needs a function that returns a promise `() => Promise<unknown>`')
      }

      return promise.then((result) => {
        const calledFunc = func()
        if (calledFunc) {
          return calledFunc.then(Array.prototype.concat.bind(result))
        }
      })
    },
    Promise.resolve([] as any),
  ) as TOutput
}

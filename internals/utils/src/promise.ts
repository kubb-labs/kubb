/** A value that may already be resolved or still pending.
 *
 * @example
 * ```ts
 * function load(id: string): PossiblePromise<string> {
 *   return cache.get(id) ?? fetchRemote(id)
 * }
 * ```
 */
export type PossiblePromise<T> = Promise<T> | T

/** Returns `true` when `result` is a thenable `Promise`.
 *
 * @example
 * ```ts
 * isPromise(Promise.resolve(1)) // true
 * isPromise(42)                 // false
 * ```
 */
export function isPromise<T>(result: PossiblePromise<T>): result is Promise<T> {
  return result !== null && result !== undefined && typeof (result as Record<string, unknown>)['then'] === 'function'
}

type Store<TKey, TValue> = {
  has(key: TKey): boolean
  get(key: TKey): TValue | undefined
  set(key: TKey, value: TValue): unknown
}

/**
 * Wraps `factory` with a keyed cache backed by the provided store.
 *
 * Pass a `WeakMap` for object keys (results are GC-eligible when the key is
 * collected) or a `Map` for primitive keys. For multi-argument functions,
 * nest two `memoize` calls — the outer keyed by the first argument, the
 * inner (created once per outer miss) keyed by the second.
 *
 * Because the cache is owned by the caller, it can be shared, inspected, or
 * cleared independently of the memoized function.
 *
 * @example Single WeakMap key
 * ```ts
 * const cache = new WeakMap<SchemaNode, Set<string>>()
 * const getRefs = memoize(cache, (node) => collectRefs(node))
 * ```
 *
 * @example Single Map key (primitive)
 * ```ts
 * const cache = new Map<string, Resolver>()
 * const getResolver = memoize(cache, (name) => buildResolver(name))
 * ```
 *
 * @example Two-level (object + primitive)
 * ```ts
 * const outer = new WeakMap<Params[], Map<string, Params[]>>()
 * const fn = memoize(outer, (params) => memoize(new Map(), (key) => transform(params, key)))
 * fn(params)('camelcase')
 * ```
 */
export function memoize<TKey, TValue>(store: Store<TKey, TValue>, factory: (key: TKey) => TValue): (key: TKey) => TValue {
  return (key: TKey): TValue => {
    if (store.has(key)) return store.get(key)!
    const value = factory(key)
    store.set(key, value)
    return value
  }
}

/**
 * Container that switches between an eager `Array<T>` and a lazy `AsyncIterable<T>`.
 *
 * `Array<T>` by default. With `Stream` set to `true` it becomes `AsyncIterable<T>`, so large
 * collections can be produced lazily without holding every item in memory. Pairs with
 * {@link arrayToAsyncIterable}, which lifts a plain array into the streaming form.
 *
 * @example
 * ```ts
 * type Eager = Streamable<number> // Array<number>
 * type Lazy = Streamable<number, true> // AsyncIterable<number>
 * ```
 */
export type Streamable<T, Stream extends boolean = false> = Stream extends true ? AsyncIterable<T> : Array<T>

/**
 * Wraps a plain array in a reusable `AsyncIterable`.
 * Each `[Symbol.asyncIterator]()` call returns a fresh generator so the
 * iterable can be consumed multiple times (e.g. once per plugin pre-scan).
 *
 * @example
 * ```ts
 * const stream = arrayToAsyncIterable([1, 2, 3])
 * for await (const n of stream) console.log(n) // 1, 2, 3
 * ```
 */
export function arrayToAsyncIterable<T>(arr: ReadonlyArray<T>): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return (async function* () {
        yield* arr
      })()
    },
  }
}

function* chunks<T>(arr: ReadonlyArray<T>, size: number): Generator<Array<T>> {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size)
  }
}

export type ForBatchesOptions = {
  /**
   * Maximum batch size handed to `process`.
   * Parallel dispatch within a batch is the caller's responsibility
   * (typically via `Promise.all(batch.map(...))`).
   */
  concurrency: number
  /**
   * Called after every batch.
   *
   * Use a cheap, idempotent callback (e.g. one that short-circuits when there
   * is nothing new to do). The helper does not coalesce calls — if you need
   * throttling, do it inside `flush` itself.
   */
  flush?: () => Promise<void>
}

/**
 * Slices `source` into batches of `concurrency` items and awaits `process` for each batch.
 * Accepts both plain arrays (sync) and `AsyncIterable` (streaming).
 *
 * `process` controls whether items inside a batch run in parallel; this helper only
 * controls batch size and per-batch flushing.
 *
 * @example
 * ```ts
 * // parallel dispatch inside each batch
 * await forBatches(schemas, (batch) => Promise.all(batch.map(process)), { concurrency: 8 })
 *
 * // async iterable with a flush after every batch
 * await forBatches(stream.schemas, (batch) => dispatch(batch), { concurrency: 8, flush })
 * ```
 */
export async function forBatches<T>(
  source: ReadonlyArray<T> | AsyncIterable<T>,
  process: (batch: Array<T>) => Promise<unknown>,
  options: ForBatchesOptions,
): Promise<void> {
  const { concurrency, flush } = options

  if (Array.isArray(source)) {
    for (const batch of chunks(source, concurrency)) {
      await process(batch)
      if (flush) await flush()
    }
    return
  }

  const batch: Array<T> = []
  for await (const item of source) {
    batch.push(item)
    if (batch.length >= concurrency) {
      await process(batch.splice(0))

      if (flush) await flush()
    }
  }
  if (batch.length > 0) {
    await process(batch.splice(0))

    if (flush) await flush()
  }
}

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

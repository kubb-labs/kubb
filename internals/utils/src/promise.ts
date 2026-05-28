function* chunks<T>(arr: readonly T[], size: number): Generator<T[]> {
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
  source: readonly T[] | AsyncIterable<T>,
  process: (batch: T[]) => Promise<unknown>,
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

  const batch: T[] = []
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

/**
 * Runs `work`, passing `flush` as its periodic-flush callback, then calls
 * `flush` once more to drain any items that did not cross a flush boundary.
 *
 * @example
 * ```ts
 * await withDrain(
 *   (flush) => processItems(items, { flush }),
 *   () => writeRemainingFiles(),
 * )
 * ```
 */
export async function withDrain(work: (flush: () => Promise<void>) => Promise<void>, flush: () => Promise<void>): Promise<void> {
  await work(flush)
  await flush()
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

/** Returns `true` when `result` is a rejected `Promise.allSettled` result with a typed `reason`.
 *
 * @example
 * ```ts
 * const results = await Promise.allSettled([p1, p2])
 * results.filter(isPromiseRejectedResult<Error>).map((r) => r.reason.message)
 * ```
 */
export function isPromiseRejectedResult<T>(result: PromiseSettledResult<unknown>): result is Omit<PromiseRejectedResult, 'reason'> & { reason: T } {
  return result.status === 'rejected'
}

/**
 * Returns a wrapper that caches the result of the first invocation and replays
 * it for every subsequent call, ignoring later arguments.
 *
 * Works for sync and async factories — for async, the cached value is the
 * promise itself, so concurrent callers share one in-flight execution and
 * cannot race each other.
 *
 * @example
 * ```ts
 * const loadDocument = once(async (path: string) => parse(await readFile(path)))
 * const a = loadDocument('./a.yaml') // parses
 * const b = loadDocument('./b.yaml') // returns the cached promise from the first call
 * ```
 */
export function once<TArgs extends unknown[], TReturn>(factory: (...args: TArgs) => TReturn): (...args: TArgs) => TReturn {
  let cache: { value: TReturn } | undefined
  return (...args: TArgs): TReturn => {
    if (!cache) cache = { value: factory(...args) }
    return cache.value
  }
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
export function arrayToAsyncIterable<T>(arr: readonly T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return (async function* () {
        yield* arr
      })()
    },
  }
}

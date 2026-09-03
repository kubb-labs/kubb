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

type ParallelOptions<TItem> = {
  /**
   * Items to work through, handed out in order.
   */
  items: ReadonlyArray<TItem>
  /**
   * How many items may be in flight at once.
   */
  limit: number
  /**
   * Runs once per item, with the item's position so a caller can report progress.
   */
  run(item: TItem, index: number): Promise<void>
}

/**
 * Runs `run` over every item with at most `limit` in flight. Workers share one iterator, so each
 * takes the next item the moment it frees up instead of waiting for a batch to drain.
 *
 * @example
 * ```ts
 * await inParallel({ items: files, limit: 50, run: (file) => storage.writeItem(file.path, file.source) })
 * ```
 */
export async function inParallel<TItem>({ items, limit, run }: ParallelOptions<TItem>): Promise<void> {
  const queue = items.entries()

  const worker = async (): Promise<void> => {
    for (const [index, item] of queue) await run(item, index)
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
}

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

type Store<TKey, TValue> = {
  has(key: TKey): boolean
  get(key: TKey): TValue | undefined
  set(key: TKey, value: TValue): unknown
}

/**
 * Returns the value cached under `key` in `store`, computing and storing it on the first call.
 * Pass a `WeakMap` for object keys, so an entry goes away with its key, or a `Map` for primitive
 * keys. A cached `null` or `undefined` counts as a hit, so `compute` runs once per key.
 *
 * @example
 * `const refs = memo(refCache, node, () => collectRefs(node))`
 */
export function memo<TKey, TValue>(store: Store<TKey, TValue>, key: TKey, compute: () => TValue): TValue {
  if (store.has(key)) return store.get(key) as TValue
  const value = compute()
  store.set(key, value)
  return value
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

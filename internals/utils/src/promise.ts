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

type Collection<TKey, TValue, TValues> = Map<TKey, TValues> & {
  /**
   * Adds `value` to the values under `key`, starting them when the key is new.
   */
  add(key: TKey, value: TValue): void
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
  const cached = store.get(key)
  if (cached !== undefined || store.has(key)) return cached as TValue
  const value = compute()
  store.set(key, value)
  return value
}

/**
 * Creates a store for `memo`. With no options it is a `Map`. Each option changes one thing:
 *
 * - `weak` holds the keys weakly, in a `WeakMap`, so an entry goes away with its key.
 * - `max` bounds the store: it empties itself before the entry that would pass `max`, which keeps a
 *   cache in a long-running process from growing without end. `max: 1` keeps only the last entry.
 * - `collect` keeps many values per key, in an array (`'list'`) or a `Set` (`'set'`), and adds
 *   `add(key, value)` to put one more value under a key.
 *
 * @example
 * `const patterns = memo.create<string, RegExp>()`
 *
 * @example Freed with its key
 * `const refs = memo.create<SchemaNode, Array<string>>({ weak: true })`
 *
 * @example Bounded
 * `const names = memo.create<string, string>({ max: 100_000 })`
 *
 * @example Many values per key
 * ```ts
 * const filesByPlugin = memo.create<string, string>({ collect: 'list' })
 * filesByPlugin.add('plugin-ts', 'models.ts')
 * ```
 */
function createStore<TKey, TValue>(options?: { weak?: false; max?: undefined; collect?: undefined }): Map<TKey, TValue>
function createStore<TKey extends WeakKey, TValue>(options: { weak: true; max?: undefined; collect?: undefined }): WeakMap<TKey, TValue>
function createStore<TKey, TValue>(options: { max: number; weak?: false; collect?: undefined }): Store<TKey, TValue>
function createStore<TKey, TValue>(options: { collect: 'list'; weak?: false; max?: undefined }): Collection<TKey, TValue, Array<TValue>>
function createStore<TKey, TValue>(options: { collect: 'set'; weak?: false; max?: undefined }): Collection<TKey, TValue, Set<TValue>>
function createStore<TKey, TValue>({ weak, max, collect }: { weak?: boolean; max?: number; collect?: 'list' | 'set' } = {}): Store<TKey, TValue> {
  if (weak) return new WeakMap<WeakKey, TValue>() as Store<TKey, TValue>
  if (collect === 'list') {
    const values = new Map<TKey, Array<TValue>>()
    return Object.assign(values, {
      add: (key: TKey, value: TValue) => void memo(values, key, (): Array<TValue> => []).push(value),
    }) as unknown as Store<TKey, TValue>
  }
  if (collect === 'set') {
    const values = new Map<TKey, Set<TValue>>()
    return Object.assign(values, {
      add: (key: TKey, value: TValue) => void memo(values, key, () => new Set<TValue>()).add(value),
    }) as unknown as Store<TKey, TValue>
  }
  const entry = new Map<TKey, TValue>()
  if (max === undefined) return entry
  const set = (key: TKey, value: TValue) => {
    if (entry.size >= max) entry.clear()
    entry.set(key, value)
  }
  if (max !== 1) return { has: (key) => entry.has(key), get: (key) => entry.get(key), set }
  // A key equal to the stored one but a different object, such as a copy of a string, replaces the
  // stored key, so the next lookup is an identity hit instead of a full comparison.
  const touch = (key: TKey) => {
    if (!entry.has(key)) return false
    set(key, entry.get(key) as TValue)
    return true
  }
  return { has: touch, get: (key) => (touch(key) ? entry.get(key) : undefined), set }
}

memo.create = createStore

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
